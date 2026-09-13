from app.providers.apple.store_locator import PostalLocation, _distance_miles, _parse_store


def test_parse_store_uses_real_coordinates_and_calculated_distance() -> None:
    raw_store = {
        "storeNumber": "R075",
        "storeName": "Union Square",
        "storeSlug": "unionsquare",
        "geolocation": {"latitude": 37.7886, "longitude": -122.407159},
        "_address": {
            "line1": "300 Post Street",
            "line2": "",
            "zip": "94108",
            "city": "San Francisco",
            "state": {"code": "CA", "name": "California"},
        },
        "_storeHours": {"formattedSearchStatus": "Open until 6:00 p.m."},
    }

    store = _parse_store(raw_store, PostalLocation(latitude=37.7749, longitude=-122.4194))

    assert store is not None
    assert store.name == "Apple Union Square"
    assert store.city == "San Francisco"
    assert store.region == "CA"
    assert store.distance_miles == 1.2
    assert store.latitude == 37.7886
    assert store.hours == {"summary": "Open until 6:00 p.m."}


def test_distance_miles_matches_known_one_degree_latitude() -> None:
    assert round(_distance_miles(0, 0, 1, 0), 1) == 69.1
