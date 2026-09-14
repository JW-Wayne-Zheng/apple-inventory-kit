from __future__ import annotations

from time import perf_counter
from typing import Any

import httpx
import structlog

from app.core.config import Settings
from app.providers.base import ProviderError
from app.services.rate_limit import RefreshRateLimiter

log = structlog.get_logger()


class AppleClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.request_budget = RefreshRateLimiter(
            settings.apple_request_budget_per_minute,
            60,
        )

    async def fulfillment(self, part_number: str, postal_code: str) -> dict[str, Any]:
        if not await self.request_budget.allow("apple-fulfillment"):
            await log.awarning(
                "provider_request_budget_exhausted",
                provider="apple",
                budget_per_minute=self.settings.apple_request_budget_per_minute,
            )
            raise ProviderError(
                "Apple request budget exhausted; using cached availability",
                retryable=True,
            )
        params = {
            "fae": "true",
            "pl": "true",
            "parts.0": part_number,
            "location": postal_code,
        }
        headers = {
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9",
            "User-Agent": "OrchardInventory/0.1 (+local development; conservative polling)",
        }
        started = perf_counter()
        try:
            async with httpx.AsyncClient(
                base_url=self.settings.apple_base_url,
                timeout=self.settings.apple_request_timeout_seconds,
                follow_redirects=False,
            ) as client:
                response = await client.get(self.settings.apple_fulfillment_path, params=params, headers=headers)
                response.raise_for_status()
                data = response.json()
                if not isinstance(data, dict):
                    raise ProviderError("Apple returned a non-object response")
                return data
        except (httpx.TimeoutException, httpx.NetworkError) as exc:
            raise ProviderError("Apple availability is temporarily unreachable", retryable=True) from exc
        except (httpx.HTTPStatusError, ValueError) as exc:
            raise ProviderError("Apple availability request was rejected") from exc
        finally:
            await log.ainfo(
                "provider_request",
                provider="apple",
                operation="fulfillment",
                duration_ms=round((perf_counter() - started) * 1000, 1),
            )
