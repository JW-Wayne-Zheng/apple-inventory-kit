from __future__ import annotations

import asyncio
import hashlib
from datetime import UTC, datetime

from app.providers.base import InventoryProvider
from app.providers.mock.catalog import CATALOG, find_variant, search_catalog
from app.schemas.domain import (
    Availability,
    AvailabilityStatus,
    Product,
    Store,
    StoreAvailability,
)

STORES = [
    ("R095", "Apple Fifth Avenue", "767 Fifth Avenue", "New York", "NY", "10153", 40.7638, -73.9729),
    ("R032", "Apple SoHo", "103 Prince Street", "New York", "NY", "10012", 40.7251, -73.9991),
    ("R251", "Apple Grand Central", "45 Grand Central Terminal", "New York", "NY", "10017", 40.7527, -73.9772),
    ("R318", "Apple Queens Center", "90-15 Queens Boulevard", "Elmhurst", "NY", "11373", 40.7346, -73.8697),
    ("R224", "Apple Manhasset", "1900 Northern Boulevard", "Manhasset", "NY", "11030", 40.7965, -73.6742),
    ("R134", "Apple Garden State Plaza", "1 Garden State Plaza", "Paramus", "NJ", "07652", 40.9177, -74.0760),
]


class MockInventoryProvider(InventoryProvider):
    name = "mock"

    async def search_products(self, query: str) -> list[Product]:
        return search_catalog(query)

    async def get_product(self, product_id: str) -> Product | None:
        return next((product for product in CATALOG if product.id == product_id), None)

    async def find_stores(self, postal_code: str) -> list[Store]:
        seed = int(hashlib.sha256(postal_code.encode()).hexdigest()[:6], 16)
        stores: list[Store] = []
        for index, item in enumerate(STORES):
            store_id, name, address, city, region, zip_code, lat, lon = item
            distance = round(0.4 + ((seed + index * 37) % 140) / 10, 1)
            stores.append(
                Store(
                    id=store_id,
                    name=name,
                    address=address,
                    city=city,
                    region=region,
                    postal_code=zip_code,
                    distance_miles=distance,
                    latitude=lat,
                    longitude=lon,
                    hours={"summary": "10:00 AM–8:00 PM"},
                )
            )
        return sorted(stores, key=lambda store: store.distance_miles)[:5]

    async def get_availability(self, product_id: str, postal_code: str) -> list[StoreAvailability]:
        # Preserve real provider scheduling semantics for request coalescing.
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
        offset = int(hashlib.sha256(selected.sku.encode()).hexdigest()[:2], 16) % len(statuses)
        results = []
        for index, store in enumerate(stores):
            status = statuses[(index + offset) % len(statuses)]
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
