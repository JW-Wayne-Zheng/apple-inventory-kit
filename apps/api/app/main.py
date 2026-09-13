from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from redis.asyncio import Redis

from app.api.routes import alerts, availability, health, products, stores
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.providers.apple.client import AppleClient
from app.providers.apple.inventory_provider import AppleInventoryProvider
from app.providers.apple.store_locator import AppleStoreLocator
from app.providers.base import InventoryProvider
from app.providers.demo.inventory_provider import LocationAwareDemoProvider
from app.providers.mock.inventory_provider import MockInventoryProvider
from app.repositories.inventory import InventoryRepository
from app.services.cache import CacheBackend, MemoryCache, RedisCache
from app.services.inventory_service import InventoryService
from app.services.product_service import ProductService
from app.services.rate_limit import RefreshRateLimiter
from app.services.store_service import StoreService

settings = get_settings()
configure_logging(settings.log_level)
log = structlog.get_logger()


def build_provider() -> InventoryProvider:
    if settings.inventory_provider == "apple":
        return AppleInventoryProvider(AppleClient(settings))
    if settings.inventory_provider == "demo":
        return LocationAwareDemoProvider(AppleStoreLocator(settings))
    return MockInventoryProvider()


async def build_cache() -> tuple[CacheBackend, str]:
    try:
        redis = Redis.from_url(
            settings.redis_url,
            socket_connect_timeout=0.35,
            socket_timeout=0.35,
            decode_responses=True,
        )
        await redis.ping()
        return RedisCache(redis), "redis"
    except Exception:
        await log.awarning("redis_unavailable_using_memory_cache")
        return MemoryCache(), "memory"


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    provider = build_provider()
    cache, cache_kind = await build_cache()
    app.state.provider = provider
    app.state.cache = cache
    app.state.cache_kind = cache_kind
    app.state.product_service = ProductService(provider, cache, settings)
    app.state.store_service = StoreService(provider, cache, settings)
    app.state.inventory_service = InventoryService(provider, cache, settings, InventoryRepository())
    app.state.refresh_limiter = RefreshRateLimiter(
        settings.refresh_limit_requests, settings.refresh_limit_window_seconds
    )
    yield
    await cache.close()


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Normalized Apple retail pickup availability with a safe mock default.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"],
)

for router in (health.router, products.router, stores.router, availability.router, alerts.router):
    app.include_router(router, prefix="/api")


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException) -> JSONResponse:
    code = {
        404: "NOT_FOUND",
        429: "RATE_LIMITED",
        503: "PROVIDER_UNAVAILABLE",
    }.get(exc.status_code, "REQUEST_ERROR")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": code, "message": str(exc.detail)}},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Please check the submitted values.",
                "context": {"fields": exc.errors()},
            }
        },
    )
