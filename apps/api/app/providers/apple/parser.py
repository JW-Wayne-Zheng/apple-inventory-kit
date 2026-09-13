from __future__ import annotations

from typing import Any

from app.providers.apple.models import ApplePickupQuote
from app.providers.base import ProviderResponseError
from app.schemas.domain import AvailabilityStatus


def _text(value: object) -> str:
    return str(value) if value is not None else ""


def parse_fulfillment_response(payload: dict[str, Any], part_number: str) -> list[ApplePickupQuote]:
    """Parse the observed Apple fulfillment shape without leaking it past this module."""
    try:
        stores = payload["body"]["content"]["pickupMessage"]["stores"]
    except (KeyError, TypeError) as exc:
        raise ProviderResponseError("Apple returned an unrecognized fulfillment response") from exc
    if not isinstance(stores, list):
        raise ProviderResponseError("Apple fulfillment stores field was not a list")

    parsed: list[ApplePickupQuote] = []
    for raw_store in stores:
        if not isinstance(raw_store, dict):
            continue
        parts = raw_store.get("partsAvailability", {})
        part = parts.get(part_number, {}) if isinstance(parts, dict) else {}
        address = raw_store.get("address", {})
        address = address if isinstance(address, dict) else {}
        parsed.append(
            ApplePickupQuote(
                store_number=_text(raw_store.get("storeNumber")),
                store_name=_text(raw_store.get("storeName")),
                address=_text(address.get("address1") or address.get("street")),
                city=_text(address.get("city")),
                region=_text(address.get("state") or address.get("province")),
                postal_code=_text(address.get("postalCode")),
                distance_miles=float(raw_store.get("storeDistance", 0) or 0),
                pickup_display=_text(part.get("pickupDisplay")),
                pickup_search_quote=_text(part.get("pickupSearchQuote")),
                pickup_type=_text(part.get("pickupType")),
                part_number=part_number,
                raw=raw_store,
            )
        )
    return parsed


def normalize_status(quote: ApplePickupQuote) -> AvailabilityStatus:
    combined = " ".join([quote.pickup_display, quote.pickup_search_quote, quote.pickup_type]).casefold()
    if any(word in combined for word in ("unavailable", "not available", "sold out")):
        return AvailabilityStatus.UNAVAILABLE
    if any(word in combined for word in ("limited", "low stock")):
        return AvailabilityStatus.LIMITED
    if any(word in combined for word in ("available", "pickup today", "in stock")):
        return AvailabilityStatus.AVAILABLE
    return AvailabilityStatus.UNKNOWN
