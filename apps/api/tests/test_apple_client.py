from unittest.mock import AsyncMock

import pytest

from app.core.config import Settings
from app.providers.apple.client import AppleClient
from app.providers.base import ProviderError


@pytest.mark.asyncio
async def test_apple_client_stops_before_network_when_budget_is_exhausted() -> None:
    client = AppleClient(Settings(apple_request_budget_per_minute=1))
    client.request_budget.allow = AsyncMock(return_value=False)

    with pytest.raises(ProviderError, match="request budget exhausted"):
        await client.fulfillment("PART-NUMBER", "10001")
