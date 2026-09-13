# API reference

All responses use normalized domain models. Errors use
`{"error":{"code":"…","message":"…","context":{…}}}`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/products/search?q=iphone` | Search generic product catalog |
| GET | `/api/products/{product_id}` | Product and configurations |
| GET | `/api/stores?postal_code=10001` | Nearby stores |
| GET | `/api/stores/{store_id}?postal_code=10001` | Store detail |
| GET | `/api/availability?product_id={variant_id}&postal_code=10001` | Store availability |
| GET | `/api/availability/{variant_id}/stores/{store_id}` | One store result |
| POST | `/api/availability/refresh` | Rate-limited forced refresh |
| POST | `/api/alerts` | Create alert watchlist entry |
| GET | `/api/alerts` | List alert entries |
| DELETE | `/api/alerts/{alert_id}` | Delete alert entry |
| GET | `/api/health` | Liveness and selected provider |
| GET | `/api/health/ready` | Cache/database readiness |

Interactive OpenAPI documentation is available at `/docs` on the API service.

