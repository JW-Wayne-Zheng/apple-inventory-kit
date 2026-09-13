from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.dependencies import store_service
from app.schemas.domain import Store
from app.services.store_service import StoreService

router = APIRouter(prefix="/stores", tags=["stores"])


@router.get("", response_model=list[Store])
async def find_stores(
    postal_code: Annotated[str, Query(pattern=r"^\d{5}(?:-\d{4})?$")],
    service: Annotated[StoreService, Depends(store_service)],
) -> list[Store]:
    return await service.find(postal_code)


@router.get("/{store_id}", response_model=Store)
async def get_store(
    store_id: str,
    postal_code: Annotated[str, Query(pattern=r"^\d{5}(?:-\d{4})?$")] = "10001",
    service: Annotated[StoreService, Depends(store_service)] = None,  # type: ignore[assignment]
) -> Store:
    stores = await service.find(postal_code)
    store = next((item for item in stores if item.id == store_id), None)
    if store is None:
        raise HTTPException(status_code=404, detail="Store not found")
    return store
