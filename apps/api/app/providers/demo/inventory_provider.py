from __future__ import annotations

import asyncio
import hashlib
from datetime import UTC, datetime

from app.providers.apple.store_locator import AppleStoreLocator
from app.providers.base import InventoryProvider
from app.providers.mock.catalog import CATALOG, find_variant, search_catalog
from app.schemas.domain import Availability, AvailabilityStatus, Product, Store, StoreAvailability


class LocationAwareDemoProvider(InventoryProvider):
    """Real Apple Store locations with deterministic demonstration inventory."""

    name = "demo"

    def __init__(self, store_locator: AppleStoreLocator) -> None:
        self.store_locator = store_locator

    async def search_products(self, query: str) -> list[Product]:
        return search_catalog(query)

    async def get_product(self, product_id: str) -> Product | None:
        return next((product for product in CATALOG if product.id == product_id), None)

    async def find_stores(self, postal_code: str) -> list[Store]:
        return await self.store_locator.find_stores(postal_code)

    async def get_availability(self, product_id: str, postal_code: str) -> list[StoreAvailability]:
        await asyncio.sleep(0)
        selected = find_variant(product_id)
        if selected is None:
            return []
        stores = await self.find_stores(postal_code)
        checked_at = datetime.now(UTC)
        statuses = [
            AvailabilityStatus.AVAILABLE,
            AvailabilityStatus.LIMITED,
            AvailabilityStatus.UNAVAILABLE,
            AvailabilityStatus.AVAILABLE,
            AvailabilityStatus.UNKNOWN,
        ]
        messages = {
            AvailabilityStatus.AVAILABLE: "Available today",
            AvailabilityStatus.LIMITED: "Limited availability — order soon",
            AvailabilityStatus.UNAVAILABLE: "Currently unavailable for pickup",
            AvailabilityStatus.UNKNOWN: "Pickup status could not be confirmed",
        }
        variant_offset = int(hashlib.sha256(selected.sku.encode()).hexdigest()[:2], 16)
        results: list[StoreAvailability] = []
        for store in stores:
            store_offset = int(hashlib.sha256(store.id.encode()).hexdigest()[:2], 16)
            status = statuses[(variant_offset + store_offset) % len(statuses)]
            results.append(
                StoreAvailability(
                    product=selected,
                    store=store,
                    availability=Availability(
                        available=status in {AvailabilityStatus.AVAILABLE, AvailabilityStatus.LIMITED},
                        status=status,
                        pickup_message=messages[status],
                        last_checked_at=checked_at,
                    ),
                )
            )
        return results
