from __future__ import annotations

import asyncio
import json

import structlog

from app.core.config import Settings
from app.providers.base import InventoryProvider, ProviderError
from app.repositories.inventory import InventoryRepository
from app.schemas.domain import AvailabilityResponse, StoreAvailability
from app.services.cache import CacheBackend

log = structlog.get_logger()


class InventoryService:
    def __init__(
        self,
        provider: InventoryProvider,
        cache: CacheBackend,
        settings: Settings,
        repository: InventoryRepository,
    ) -> None:
        self.provider = provider
        self.cache = cache
        self.settings = settings
        self.repository = repository
        self._inflight: dict[str, asyncio.Task[list[StoreAvailability]]] = {}
        self._inflight_lock = asyncio.Lock()

    async def availability(self, product_id: str, postal_code: str, *, force: bool = False) -> AvailabilityResponse:
        key = f"inventory:{product_id}:{postal_code}"
        stale_key = f"inventory-stale:{product_id}:{postal_code}"
        if not force and (cached := await self.cache.get(key)):
            await log.ainfo("cache_hit", resource="inventory", key=key)
            return AvailabilityResponse(
                results=[StoreAvailability.model_validate(item) for item in json.loads(cached)],
                is_cached=True,
                provider=self.provider.name,
            )
        await log.ainfo("cache_miss", resource="inventory", key=key)
        try:
            results = await self._coalesced_fetch(key, product_id, postal_code)
        except ProviderError:
            if stale := await self.cache.get(stale_key):
                await log.awarning("provider_failure_using_stale", provider=self.provider.name)
                return AvailabilityResponse(
                    results=[StoreAvailability.model_validate(item) for item in json.loads(stale)],
                    is_cached=True,
                    is_stale=True,
                    provider=self.provider.name,
                )
            raise
        payload = json.dumps([item.model_dump(mode="json") for item in results])
        await self.cache.set(key, payload, self.settings.inventory_cache_ttl_seconds)
        await self.cache.set(stale_key, payload, self.settings.inventory_stale_ttl_seconds)
        if self.settings.persist_inventory:
            try:
                await self.repository.record(results)
            except Exception as exc:  # Persistence must not take inventory offline.
                await log.aexception("snapshot_persistence_failed", error_type=type(exc).__name__)
        return AvailabilityResponse(results=results, provider=self.provider.name)

    async def _coalesced_fetch(self, key: str, product_id: str, postal_code: str) -> list[StoreAvailability]:
        async with self._inflight_lock:
            task = self._inflight.get(key)
            if task is None:
                task = asyncio.create_task(self.provider.get_availability(product_id, postal_code))
                self._inflight[key] = task
        try:
            return await asyncio.shield(task)
        finally:
            if task.done():
                async with self._inflight_lock:
                    self._inflight.pop(key, None)
