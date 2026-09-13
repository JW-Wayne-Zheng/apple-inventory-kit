from abc import ABC, abstractmethod

from app.schemas.domain import Product, Store, StoreAvailability


class InventoryProvider(ABC):
    """Boundary around all upstream product, store, and inventory behavior."""

    name: str

    @abstractmethod
    async def search_products(self, query: str) -> list[Product]: ...

    @abstractmethod
    async def get_product(self, product_id: str) -> Product | None: ...

    @abstractmethod
    async def find_stores(self, postal_code: str) -> list[Store]: ...

    @abstractmethod
    async def get_availability(self, product_id: str, postal_code: str) -> list[StoreAvailability]: ...


class ProviderError(RuntimeError):
    def __init__(self, message: str, *, retryable: bool = False) -> None:
        super().__init__(message)
        self.retryable = retryable


class ProviderResponseError(ProviderError):
    pass
