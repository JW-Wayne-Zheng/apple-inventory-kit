from __future__ import annotations

import json

import structlog

from app.core.config import Settings
from app.providers.base import InventoryProvider
from app.schemas.domain import Product
from app.services.cache import CacheBackend

log = structlog.get_logger()


class ProductService:
    def __init__(self, provider: InventoryProvider, cache: CacheBackend, settings: Settings) -> None:
        self.provider = provider
        self.cache = cache
        self.settings = settings

    async def search(self, query: str) -> list[Product]:
        key = f"products:{query.casefold().strip()}"
        if cached := await self.cache.get(key):
            await log.ainfo("cache_hit", resource="products")
            return [Product.model_validate(item) for item in json.loads(cached)]
        await log.ainfo("cache_miss", resource="products")
        products = await self.provider.search_products(query)
        await self.cache.set(
            key,
            json.dumps([product.model_dump(mode="json") for product in products]),
            self.settings.product_cache_ttl_seconds,
        )
        return products

    async def get(self, product_id: str) -> Product | None:
        return await self.provider.get_product(product_id)
