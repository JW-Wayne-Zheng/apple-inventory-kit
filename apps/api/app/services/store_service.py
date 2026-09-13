from __future__ import annotations

import json

import structlog

from app.core.config import Settings
from app.providers.base import InventoryProvider
from app.schemas.domain import Store
from app.services.cache import CacheBackend

log = structlog.get_logger()


class StoreService:
    def __init__(self, provider: InventoryProvider, cache: CacheBackend, settings: Settings) -> None:
        self.provider = provider
        self.cache = cache
        self.settings = settings

    async def find(self, postal_code: str) -> list[Store]:
        key = f"stores:{postal_code}"
        if cached := await self.cache.get(key):
            await log.ainfo("cache_hit", resource="stores")
            return [Store.model_validate(item) for item in json.loads(cached)]
        stores = await self.provider.find_stores(postal_code)
        await self.cache.set(
            key,
            json.dumps([store.model_dump(mode="json") for store in stores]),
            self.settings.store_cache_ttl_seconds,
        )
        return stores
