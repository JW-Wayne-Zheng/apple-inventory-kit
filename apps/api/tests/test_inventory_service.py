import asyncio

import pytest

from app.core.config import Settings
from app.providers.mock.inventory_provider import MockInventoryProvider
from app.repositories.inventory import InventoryRepository
from app.services.cache import MemoryCache
from app.services.inventory_service import InventoryService


@pytest.mark.asyncio
async def test_inventory_cache_and_request_coalescing() -> None:
    provider = MockInventoryProvider()
    service = InventoryService(
        provider,
        MemoryCache(),
        Settings(persist_inventory=False),
        InventoryRepository(),
    )
    first, second = await asyncio.gather(
        service.availability("iphone-18-pro", "10001"),
        service.availability("iphone-18-pro", "10001"),
    )
    assert first.results == second.results
    cached = await service.availability("iphone-18-pro", "10001")
    assert cached.is_cached is True
