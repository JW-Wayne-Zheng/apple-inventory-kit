from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Orchard Inventory API"
    app_env: str = "development"
    log_level: str = "INFO"
    cors_origins: str = "http://localhost:3000"
    inventory_provider: Literal["mock", "demo", "apple"] = "demo"
    apple_base_url: str = "https://www.apple.com"
    apple_fulfillment_path: str = "/shop/fulfillment-messages"
    apple_graphql_path: str = "/api-www/graphql"
    apple_store_search_query_id: str = "d95caa379372fe166f35bb89fe8e018e21781c66ee815ee3f68105f36ff4b1d8"
    apple_country: str = "US"
    apple_request_timeout_seconds: float = 8.0
    apple_request_budget_per_minute: int = Field(default=4, ge=1, le=12)
    postal_lookup_base_url: str = "https://api.zippopotam.us"
    database_url: str = "postgresql+asyncpg://inventory:inventory@localhost:5432/inventory"
    redis_url: str = "redis://localhost:6379/0"
    persist_inventory: bool = True
    inventory_cache_ttl_seconds: int = Field(default=30, ge=30, le=300)
    inventory_stale_ttl_seconds: int = Field(default=900, ge=60, le=86400)
    inventory_stream_poll_seconds: int = Field(default=5, ge=2, le=30)
    store_cache_ttl_seconds: int = Field(default=86400, ge=60)
    product_cache_ttl_seconds: int = Field(default=21600, ge=60)
    refresh_limit_requests: int = Field(default=6, ge=1)
    refresh_limit_window_seconds: int = Field(default=60, ge=1)

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
