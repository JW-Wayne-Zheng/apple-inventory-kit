"""Create inventory tables."""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "20260913_01"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "products",
        sa.Column("id", sa.String(100), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("category", sa.String(100), nullable=False),
        sa.Column("image_url", sa.Text()),
        sa.Column("product_url", sa.Text()),
    )
    op.create_table(
        "stores",
        sa.Column("id", sa.String(100), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("address", sa.Text(), nullable=False),
        sa.Column("city", sa.String(100), nullable=False),
        sa.Column("region", sa.String(50), nullable=False),
        sa.Column("postal_code", sa.String(20), nullable=False),
        sa.Column("latitude", sa.Float()),
        sa.Column("longitude", sa.Float()),
        sa.Column("hours", postgresql.JSONB()),
    )
    op.create_table(
        "product_variants",
        sa.Column("id", sa.String(100), primary_key=True),
        sa.Column(
            "product_id",
            sa.String(100),
            sa.ForeignKey("products.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("sku", sa.String(100), unique=True, nullable=False),
        sa.Column("part_number", sa.String(100)),
        sa.Column("price", sa.Numeric(10, 2)),
        sa.Column("attributes", postgresql.JSONB(), nullable=False, server_default="{}"),
    )
    op.create_table(
        "inventory_snapshots",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "variant_id",
            sa.String(100),
            sa.ForeignKey("product_variants.id"),
            nullable=False,
        ),
        sa.Column(
            "store_id",
            sa.String(100),
            sa.ForeignKey("stores.id"),
            nullable=False,
        ),
        sa.Column("status", sa.String(30), nullable=False),
        sa.Column("pickup_message", sa.Text()),
        sa.Column("observed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Index("ix_inventory_snapshot_lookup", "variant_id", "store_id", "observed_at"),
    )
    op.create_table(
        "inventory_alerts",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("contact", sa.String(320), nullable=False),
        sa.Column("channel", sa.String(30), nullable=False),
        sa.Column("product_variant_id", sa.String(100), nullable=False),
        sa.Column("store_id", sa.String(100)),
        sa.Column("postal_code", sa.String(20)),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_triggered_at", sa.DateTime(timezone=True)),
    )


def downgrade() -> None:
    op.drop_table("inventory_alerts")
    op.drop_table("inventory_snapshots")
    op.drop_table("product_variants")
    op.drop_table("stores")
    op.drop_table("products")
