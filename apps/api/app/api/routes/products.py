from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.dependencies import product_service
from app.schemas.domain import Product
from app.services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/search", response_model=list[Product])
async def search_products(
    q: Annotated[str, Query(min_length=1, max_length=100)],
    service: Annotated[ProductService, Depends(product_service)],
) -> list[Product]:
    return await service.search(q)


@router.get("/{product_id}", response_model=Product)
async def get_product(
    product_id: str,
    service: Annotated[ProductService, Depends(product_service)],
) -> Product:
    product = await service.get(product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
