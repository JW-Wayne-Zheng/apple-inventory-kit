from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.repositories.alerts import AlertRepository
from app.schemas.domain import Alert, AlertCreate

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.post("", response_model=Alert, status_code=status.HTTP_201_CREATED)
async def create_alert(body: AlertCreate, session: Annotated[AsyncSession, Depends(get_db)]) -> Alert:
    return await AlertRepository(session).create(body)


@router.get("", response_model=list[Alert])
async def list_alerts(session: Annotated[AsyncSession, Depends(get_db)]) -> list[Alert]:
    return await AlertRepository(session).list()


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alert(alert_id: UUID, session: Annotated[AsyncSession, Depends(get_db)]) -> Response:
    deleted = await AlertRepository(session).delete(alert_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Alert not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
