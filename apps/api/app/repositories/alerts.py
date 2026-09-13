from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tables import InventoryAlertRow
from app.schemas.domain import Alert, AlertCreate


class AlertRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, request: AlertCreate) -> Alert:
        row = InventoryAlertRow(**request.model_dump(), created_at=datetime.now(UTC), enabled=True)
        self.session.add(row)
        await self.session.commit()
        await self.session.refresh(row)
        return self._to_schema(row)

    async def list(self) -> list[Alert]:
        rows = (await self.session.scalars(select(InventoryAlertRow))).all()
        return [self._to_schema(row) for row in rows]

    async def delete(self, alert_id: UUID) -> bool:
        row = await self.session.get(InventoryAlertRow, alert_id)
        if row is None:
            return False
        await self.session.delete(row)
        await self.session.commit()
        return True

    @staticmethod
    def _to_schema(row: InventoryAlertRow) -> Alert:
        return Alert.model_validate(row, from_attributes=True)
