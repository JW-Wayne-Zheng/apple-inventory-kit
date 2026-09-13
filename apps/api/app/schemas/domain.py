from __future__ import annotations

from datetime import UTC, datetime
from enum import StrEnum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, model_validator


class AvailabilityStatus(StrEnum):
    AVAILABLE = "AVAILABLE"
    LIMITED = "LIMITED"
    UNAVAILABLE = "UNAVAILABLE"
    UNKNOWN = "UNKNOWN"


class ProductVariant(BaseModel):
    id: str
    product_id: str
    sku: str
    part_number: str | None = None
    price: float | None = None
    attributes: dict[str, str] = Field(default_factory=dict)

    @property
    def configuration(self) -> str:
        return " · ".join(self.attributes.values()) or "Standard"


class Product(BaseModel):
    id: str
    name: str
    category: str
    description: str | None = None
    image_url: str | None = None
    product_url: str | None = None
    variants: list[ProductVariant] = Field(default_factory=list)


class Store(BaseModel):
    id: str
    name: str
    address: str
    city: str
    region: str
    postal_code: str
    distance_miles: float
    latitude: float | None = None
    longitude: float | None = None
    hours: dict[str, str] | None = None


class Availability(BaseModel):
    available: bool
    status: AvailabilityStatus
    pickup_message: str
    last_checked_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class StoreAvailability(BaseModel):
    product: ProductVariant
    store: Store
    availability: Availability


class AvailabilityResponse(BaseModel):
    results: list[StoreAvailability]
    is_cached: bool = False
    is_stale: bool = False
    provider: str


class RefreshRequest(BaseModel):
    product_id: str = Field(min_length=1, max_length=100)
    postal_code: str = Field(pattern=r"^\d{5}(?:-\d{4})?$")


class AlertCreate(BaseModel):
    contact: EmailStr
    channel: str = Field(default="email", pattern=r"^(email|sms|push)$")
    product_variant_id: str = Field(min_length=1, max_length=100)
    store_id: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, pattern=r"^\d{5}(?:-\d{4})?$")

    @model_validator(mode="after")
    def require_scope(self) -> AlertCreate:
        if not self.store_id and not self.postal_code:
            raise ValueError("Either store_id or postal_code is required")
        return self


class Alert(BaseModel):
    id: UUID
    contact: str
    channel: str
    product_variant_id: str
    store_id: str | None
    postal_code: str | None
    enabled: bool
    created_at: datetime
    last_triggered_at: datetime | None = None


class ErrorDetail(BaseModel):
    code: str
    message: str
    context: dict[str, Any] | None = None


class ErrorResponse(BaseModel):
    error: ErrorDetail
