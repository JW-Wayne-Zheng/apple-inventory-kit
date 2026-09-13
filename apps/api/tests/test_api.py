from fastapi.testclient import TestClient

from app.main import app


def test_health_and_product_search() -> None:
    with TestClient(app) as client:
        health = client.get("/api/health")
        assert health.status_code == 200
        assert health.json()["provider"] == "mock"
        products = client.get("/api/products/search", params={"q": "iPhone"})
        assert products.status_code == 200
        assert [product["name"] for product in products.json()] == [
            "iPhone 18 Pro",
            "iPhone 18 Pro Max",
        ]


def test_availability_and_input_validation() -> None:
    with TestClient(app) as client:
        response = client.get("/api/availability", params={"product_id": "iphone-18-pro", "postal_code": "10001"})
        assert response.status_code == 200
        assert len(response.json()["results"]) == 5
        invalid = client.get("/api/availability", params={"product_id": "iphone-18-pro", "postal_code": "nope"})
        assert invalid.status_code == 422
        assert invalid.json()["error"]["code"] == "VALIDATION_ERROR"
