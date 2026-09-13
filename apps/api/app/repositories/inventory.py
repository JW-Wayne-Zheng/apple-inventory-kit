from __future__ import annotations

from sqlalchemy.dialects.postgresql import insert

from app.db.session import SessionLocal
from app.models.tables import InventorySnapshotRow, ProductRow, ProductVariantRow, StoreRow
from app.schemas.domain import StoreAvailability


class InventoryRepository:
    """Persists normalized snapshots; upstream response shapes never reach this layer."""

    async def record(self, results: list[StoreAvailability]) -> None:
        if not results:
            return
        async with SessionLocal() as session:
            for item in results:
                product = item.product
                await session.execute(
                    insert(ProductRow)
                    .values(id=product.product_id, name=product.product_id, category="Unknown")
                    .on_conflict_do_nothing(index_elements=[ProductRow.id])
                )
                await session.execute(
                    insert(ProductVariantRow)
                    .values(
                        id=product.id,
                        product_id=product.product_id,
                        sku=product.sku,
                        part_number=product.part_number,
                        price=product.price,
                        attributes=product.attributes,
                    )
                    .on_conflict_do_nothing(index_elements=[ProductVariantRow.id])
                )
                store = item.store
                await session.execute(
                    insert(StoreRow)
                    .values(
                        id=store.id,
                        name=store.name,
                        address=store.address,
                        city=store.city,
                        region=store.region,
                        postal_code=store.postal_code,
                        latitude=store.latitude,
                        longitude=store.longitude,
                        hours=store.hours,
                    )
                    .on_conflict_do_update(
                        index_elements=[StoreRow.id],
                        set_={
                            "name": store.name,
                            "address": store.address,
                            "hours": store.hours,
                        },
                    )
                )
                session.add(
                    InventorySnapshotRow(
                        variant_id=product.id,
                        store_id=store.id,
                        status=item.availability.status.value,
                        pickup_message=item.availability.pickup_message,
                        observed_at=item.availability.last_checked_at,
                    )
                )
            await session.commit()
