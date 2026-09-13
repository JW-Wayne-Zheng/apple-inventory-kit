from fastapi import APIRouter, Request
from sqlalchemy import text

from app.core.config import get_settings
from app.db.session import SessionLocal

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def health(request: Request) -> dict[str, str]:
    return {
        "status": "ok",
        "provider": request.app.state.provider.name,
        "environment": get_settings().app_env,
    }


@router.get("/ready")
async def ready(request: Request) -> dict[str, object]:
    checks: dict[str, str] = {"api": "ok", "cache": request.app.state.cache_kind}
    if get_settings().persist_inventory:
        try:
            async with SessionLocal() as session:
                await session.execute(text("SELECT 1"))
            checks["database"] = "ok"
        except Exception:
            checks["database"] = "unavailable"
    return {"status": "ok" if "unavailable" not in checks.values() else "degraded", "checks": checks}
