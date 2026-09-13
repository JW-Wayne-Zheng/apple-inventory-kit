import pytest

from app.providers.apple.parser import normalize_status, parse_fulfillment_response
from app.providers.base import ProviderResponseError
from app.schemas.domain import AvailabilityStatus


def test_parser_normalizes_observed_apple_shape() -> None:
    payload = {
        "body": {
            "content": {
                "pickupMessage": {
                    "stores": [
                        {
                            "storeNumber": "R095",
                            "storeName": "Apple Fifth Avenue",
                            "storeDistance": 2.4,
                            "address": {
                                "address1": "767 Fifth Avenue",
                                "city": "New York",
                                "state": "NY",
                                "postalCode": "10153",
                            },
                            "partsAvailability": {
                                "TEST-SKU": {
                                    "pickupDisplay": "available",
                                    "pickupSearchQuote": "Available today",
                                }
                            },
                        }
                    ]
                }
            }
        }
    }
    results = parse_fulfillment_response(payload, "TEST-SKU")
    assert results[0].store_number == "R095"
    assert normalize_status(results[0]) is AvailabilityStatus.AVAILABLE


def test_parser_rejects_unknown_shape() -> None:
    with pytest.raises(ProviderResponseError):
        parse_fulfillment_response({"changed": True}, "TEST-SKU")
