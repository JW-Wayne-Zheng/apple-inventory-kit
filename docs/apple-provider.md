# Apple provider research

Research date: 2026-09-13. Market: United States consumer storefront.

## Status

Apple documents the customer-facing pickup workflow, but not a public retail inventory API. Apple's
shopping help says product pages let customers enter a city or ZIP code and that products marked
available today can usually be picked up within an hour. This is a storefront feature, not an API
contract.

The current public iPhone buy page includes a JavaScript `window.fulfillmentBootstrap` object. In a
normal browser page load it advertised these same-origin routes:

- `GET /shop/fulfillment-messages?fae=true&pl=true`
- `GET /shop/product-locator-meta?fae=true`
- `GET /shop/address/locality-lookup?fae=true`
- `GET /shop/address/geo-lookup?fae=true`

The product page's public bootstrap data also contained `sku` and `partNumber` values. A sanitized
example is `{"sku":"MG…","partNumber":"MG…LL/A"}`.

## Observed fulfillment request

Method: `GET`

Configured endpoint:

```text
https://www.apple.com/shop/fulfillment-messages
```

Relevant query parameters observed in the storefront implementation and used by the adapter:

| Parameter | Purpose |
| --- | --- |
| `fae=true` | Storefront feature flag present in the current bootstrap |
| `pl=true` | Product-locator/pickup response |
| `parts.0=<part number>` | Selected merchant part number; numbered for multiple parts |
| `location=<ZIP or locality>` | Search origin |

Ordinary browser headers such as `Accept: application/json` and locale are sufficient inputs in the
adapter. Orchard does not store or replay Apple cookies, private headers, account data, or tokens.
It does not solve challenges or follow redirects to access-controlled flows.

## Response mapping

Historically observed/supported parser shape (sanitized):

```json
{
  "body": {
    "content": {
      "pickupMessage": {
        "stores": [{
          "storeNumber": "R…",
          "storeName": "Apple …",
          "storeDistance": 3.2,
          "address": {
            "address1": "…",
            "city": "…",
            "state": "NY",
            "postalCode": "…"
          },
          "partsAvailability": {
            "MG…LL/A": {
              "pickupDisplay": "available",
              "pickupSearchQuote": "Available today",
              "pickupType": "…"
            }
          }
        }]
      }
    }
  }
}
```

| Apple field | Normalized field |
| --- | --- |
| `storeNumber` | `store.id` |
| `storeName` | `store.name` |
| `address.*` | `store.address/city/region/postal_code` |
| `storeDistance` | `store.distance_miles` |
| selected `partsAvailability` entry | `availability` |
| `pickupSearchQuote` / `pickupDisplay` | `availability.pickup_message` |

The parser recognizes available, limited, and unavailable language conservatively. Anything else is
`UNKNOWN`. A missing or changed response path raises a provider response error; it is never guessed.

## What the verification showed

The buy page loaded normally and visibly offered “Pick up from Store.” The public bootstrap confirmed
the routes and parameters above. A direct fulfillment request from this automated environment was
blocked by the browser client, and a server-side probe returned a nonstandard rejection response.
No attempt was made to bypass that protection. Consequently, live inventory mode is experimental. The
default is `INVENTORY_PROVIDER=demo`, which uses Apple's public retail directory for real locations while
clearly presenting deterministic inventory status as simulated.

No formal rate-limit headers or documented quotas were observed because the fulfillment response was
not available in this environment. Orchard does not attempt to discover a limit by load-testing Apple.
It uses 30-second shared inventory caching, a four-request-per-minute budget per API process, 15-minute stale
fallback, per-client refresh throttling, request coalescing, short timeouts, no aggressive retries, and no
automated live-provider tests. The request budget is an application safety ceiling, not an Apple quota.

## Stability and legal risk

- The endpoint, parameters, flags, field names, and availability phrases can change without notice.
- Apple may restrict automated access or require context unavailable to a backend service.
- Product/part discovery is separate from fulfillment and has no supported API contract.
- Availability is informational and can change before an order is completed.
- Operators must review Apple's terms and applicable law for their deployment and traffic pattern.

## Fallback strategy

Demo mode combines ZIP centroids from Zippopotam.us with Apple's public persisted retail-directory query,
then calculates distances locally and overlays deterministic simulated stock. Mock mode is fully offline.
In Apple inventory mode, successful normalized responses are cached; transient provider failure returns the
longer-lived cached snapshot marked `is_stale=true`. With no snapshot, the API returns a structured 503.
Switching providers is configuration only; routes, services, database records, and frontend types do not change.
