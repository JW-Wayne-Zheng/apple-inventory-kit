from __future__ import annotations

from datetime import UTC, datetime

from app.providers.apple.client import AppleClient
from app.providers.apple.parser import normalize_status, parse_fulfillment_response
from app.providers.base import InventoryProvider
from app.providers.mock.catalog import CATALOG, find_variant, search_catalog
from app.schemas.domain import Availability, Product, Store, StoreAvailability


class AppleInventoryProvider(InventoryProvider):
    """Experimental adapter for Apple's public, undocumented fulfillment request."""

    name = "apple-experimental"

    def __init__(self, client: AppleClient) -> None:
        self.client = client

    async def search_products(self, query: str) -> list[Product]:
        # Apple exposes no supported product search API; catalog discovery is intentionally separate.
        return search_catalog(query)

    async def get_product(self, product_id: str) -> Product | None:
        return next((product for product in CATALOG if product.id == product_id), None)

    async def find_stores(self, postal_code: str) -> list[Store]:
        # Store results are part-number dependent in the observed endpoint.
        return []

    async def get_availability(self, product_id: str, postal_code: str) -> list[StoreAvailability]:
        selected = find_variant(product_id)
        if selected is None or selected.part_number is None:
            return []
        payload = await self.client.fulfillment(selected.part_number, postal_code)
        quotes = parse_fulfillment_response(payload, selected.part_number)
        checked_at = datetime.now(UTC)
        results = []
        for quote in quotes:
            status = normalize_status(quote)
            store = Store(
                id=quote.store_number,
                name=quote.store_name,
                address=quote.address,
                city=quote.city,
                region=quote.region,
                postal_code=quote.postal_code,
                distance_miles=quote.distance_miles,
            )
            results.append(
                StoreAvailability(
                    product=selected,
                    store=store,
                    availability=Availability(
                        available=status.value in {"AVAILABLE", "LIMITED"},
                        status=status,
                        pickup_message=quote.pickup_search_quote or quote.pickup_display or "Status unknown",
                        last_checked_at=checked_at,
                    ),
                )
            )
        return results
