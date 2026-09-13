from __future__ import annotations

import asyncio
import math
from dataclasses import dataclass
from time import monotonic
from typing import Any

import httpx

from app.core.config import Settings
from app.providers.base import ProviderError, ProviderResponseError
from app.schemas.domain import Store

EARTH_RADIUS_MILES = 3958.8


@dataclass(frozen=True)
class PostalLocation:
    latitude: float
    longitude: float


class AppleStoreLocator:
    """Resolve a U.S. ZIP code and rank Apple's public U.S. store directory."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._stores: list[dict[str, Any]] | None = None
        self._stores_loaded_at = 0.0
        self._store_lock = asyncio.Lock()
        self._postal_locations: dict[str, PostalLocation] = {}

    async def find_stores(self, postal_code: str) -> list[Store]:
        location = await self._resolve_postal_code(postal_code)
        stores = await self._load_us_stores()
        normalized: list[Store] = []
        for raw_store in stores:
            store = _parse_store(raw_store, location)
            if store is not None:
                normalized.append(store)
        return sorted(normalized, key=lambda item: item.distance_miles)

    async def _resolve_postal_code(self, postal_code: str) -> PostalLocation:
        if cached := self._postal_locations.get(postal_code):
            return cached
        url = f"{self.settings.postal_lookup_base_url.rstrip('/')}/us/{postal_code}"
        try:
            async with httpx.AsyncClient(
                timeout=self.settings.apple_request_timeout_seconds,
                follow_redirects=False,
            ) as client:
                response = await client.get(url, headers={"Accept": "application/json"})
            if response.status_code == 404:
                raise ProviderResponseError("That ZIP code could not be located")
            response.raise_for_status()
            payload = response.json()
            places = payload.get("places", []) if isinstance(payload, dict) else []
            place = places[0] if isinstance(places, list) and places else None
            if not isinstance(place, dict):
                raise ProviderResponseError("That ZIP code could not be located")
            location = PostalLocation(
                latitude=float(place["latitude"]),
                longitude=float(place["longitude"]),
            )
        except ProviderResponseError:
            raise
        except (httpx.HTTPError, KeyError, TypeError, ValueError) as exc:
            raise ProviderError("ZIP lookup is temporarily unavailable", retryable=True) from exc
        self._postal_locations[postal_code] = location
        return location

    async def _load_us_stores(self) -> list[dict[str, Any]]:
        if self._stores is not None and monotonic() - self._stores_loaded_at < self.settings.store_cache_ttl_seconds:
            return self._stores
        async with self._store_lock:
            cache_is_current = (
                self._stores is not None
                and monotonic() - self._stores_loaded_at < self.settings.store_cache_ttl_seconds
            )
            if cache_is_current:
                assert self._stores is not None
                return self._stores
            body = {
                "operationName": "StoreSearchByLocale",
                "variables": {"localeId": "en_US"},
                "extensions": {
                    "persistedQuery": {
                        "version": 1,
                        "sha256Hash": self.settings.apple_store_search_query_id,
                    }
                },
            }
            headers = {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "User-Agent": "OrchardInventory/0.1 (+local development; conservative requests)",
            }
            try:
                async with httpx.AsyncClient(
                    base_url=self.settings.apple_base_url,
                    timeout=self.settings.apple_request_timeout_seconds,
                    follow_redirects=False,
                ) as client:
                    response = await client.post(self.settings.apple_graphql_path, json=body, headers=headers)
                response.raise_for_status()
                payload = response.json()
                if not isinstance(payload, dict) or payload.get("errors"):
                    raise ProviderResponseError("Apple's store directory returned an error")
                stores = payload["data"]["rmdLocale"]["stores"]
                if not isinstance(stores, list):
                    raise ProviderResponseError("Apple's store directory returned an unexpected response")
            except ProviderResponseError:
                raise
            except (httpx.HTTPError, KeyError, TypeError, ValueError) as exc:
                raise ProviderError("Apple's store directory is temporarily unavailable", retryable=True) from exc
            self._stores = [item for item in stores if isinstance(item, dict)]
            self._stores_loaded_at = monotonic()
            return self._stores


def _parse_store(raw_store: dict[str, Any], origin: PostalLocation) -> Store | None:
    coordinates = raw_store.get("geolocation")
    address = raw_store.get("_address")
    if not isinstance(coordinates, dict) or not isinstance(address, dict):
        return None
    try:
        latitude = float(coordinates["latitude"])
        longitude = float(coordinates["longitude"])
    except (KeyError, TypeError, ValueError):
        return None
    state = address.get("state")
    state = state if isinstance(state, dict) else {}
    hours = raw_store.get("_storeHours")
    hours = hours if isinstance(hours, dict) else {}
    distance = _distance_miles(origin.latitude, origin.longitude, latitude, longitude)
    name = str(raw_store.get("storeName") or "Apple Store")
    return Store(
        id=str(raw_store.get("storeNumber") or raw_store.get("storeSlug") or name),
        name=name if name.startswith("Apple ") else f"Apple {name}",
        address=" ".join(
            str(line).strip()
            for line in (address.get("line1"), address.get("line2"))
            if line and str(line).strip()
        ),
        city=str(address.get("city") or ""),
        region=str(state.get("code") or state.get("name") or ""),
        postal_code=str(address.get("zip") or ""),
        distance_miles=round(distance, 1),
        latitude=latitude,
        longitude=longitude,
        hours={"summary": str(hours["formattedSearchStatus"])} if hours.get("formattedSearchStatus") else None,
    )


def _distance_miles(latitude_a: float, longitude_a: float, latitude_b: float, longitude_b: float) -> float:
    latitude_delta = math.radians(latitude_b - latitude_a)
    longitude_delta = math.radians(longitude_b - longitude_a)
    a = (
        math.sin(latitude_delta / 2) ** 2
        + math.cos(math.radians(latitude_a))
        * math.cos(math.radians(latitude_b))
        * math.sin(longitude_delta / 2) ** 2
    )
    return EARTH_RADIUS_MILES * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
