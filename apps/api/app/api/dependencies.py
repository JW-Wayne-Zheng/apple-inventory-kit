from typing import cast

from fastapi import Request

from app.services.inventory_service import InventoryService
from app.services.product_service import ProductService
from app.services.rate_limit import RefreshRateLimiter
from app.services.store_service import StoreService


def product_service(request: Request) -> ProductService:
    return cast(ProductService, request.app.state.product_service)


def store_service(request: Request) -> StoreService:
    return cast(StoreService, request.app.state.store_service)


def inventory_service(request: Request) -> InventoryService:
    return cast(InventoryService, request.app.state.inventory_service)


def refresh_limiter(request: Request) -> RefreshRateLimiter:
    return cast(RefreshRateLimiter, request.app.state.refresh_limiter)
