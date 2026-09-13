from typing import Annotated

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app.api.dependencies import inventory_service, refresh_limiter
from app.providers.base import ProviderError
from app.schemas.domain import AvailabilityResponse, RefreshRequest
from app.services.inventory_service import InventoryService
from app.services.rate_limit import RefreshRateLimiter

router = APIRouter(prefix="/availability", tags=["availability"])
log = structlog.get_logger()


async def _load(
    service: InventoryService, product_id: str, postal_code: str, *, force: bool = False
) -> AvailabilityResponse:
    try:
        response = await service.availability(product_id, postal_code, force=force)
    except ProviderError as exc:
        raise HTTPException(
            status_code=503,
            detail="We couldn't refresh Apple Store availability right now.",
        ) from exc
    if not response.results:
        raise HTTPException(status_code=404, detail="No product or nearby availability found")
    return response


@router.get("", response_model=AvailabilityResponse)
async def get_availability(
    product_id: Annotated[str, Query(min_length=1, max_length=100)],
    postal_code: Annotated[str, Query(pattern=r"^\d{5}(?:-\d{4})?$")],
    service: Annotated[InventoryService, Depends(inventory_service)],
) -> AvailabilityResponse:
    return await _load(service, product_id, postal_code)


@router.get("/{product_id}/stores/{store_id}", response_model=AvailabilityResponse)
async def get_store_availability(
    product_id: str,
    store_id: str,
    service: Annotated[InventoryService, Depends(inventory_service)],
    postal_code: Annotated[str, Query(pattern=r"^\d{5}(?:-\d{4})?$")] = "10001",
) -> AvailabilityResponse:
    response = await _load(service, product_id, postal_code)
    response.results = [result for result in response.results if result.store.id == store_id]
    if not response.results:
        raise HTTPException(status_code=404, detail="Availability for this store was not found")
    return response


@router.post("/refresh", response_model=AvailabilityResponse)
async def refresh_availability(
    body: RefreshRequest,
    request: Request,
    service: Annotated[InventoryService, Depends(inventory_service)],
    limiter: Annotated[RefreshRateLimiter, Depends(refresh_limiter)],
) -> AvailabilityResponse:
    client_id = request.client.host if request.client else "unknown"
    if not await limiter.allow(client_id):
        raise HTTPException(status_code=429, detail="Refresh limit reached. Try again in a minute.")
    await log.ainfo("inventory_refresh", client_id=client_id)
    return await _load(service, body.product_id, body.postal_code, force=True)
