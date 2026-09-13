# Architecture

Orchard treats upstream inventory as unreliable and replaceable:

```text
AppleInventoryProvider ────────┐
LocationAwareDemoProvider ─────┼─> normalized Pydantic models -> InventoryService
MockInventoryProvider ─────────┘                                  │
                                                                ├─> Redis cache
                                                                ├─> PostgreSQL history
                                                                └─> FastAPI -> Next.js
```

The route layer never sees an Apple response. Provider adapters emit `Product`, `Store`, and
`StoreAvailability`; only the Apple parser knows Apple's field names. Inventory cache keys are
the normalized variant ID and postal code. A second, longer-lived entry supports stale-on-error.

Concurrent cache misses for the same variant and location share one in-process request. Manual
refreshes are limited per client. These controls complement Redis caching; they are not an attempt
to evade upstream controls. A distributed lock should be added before horizontally scaling the API.

The default demo provider resolves a U.S. ZIP centroid through Zippopotam.us, downloads Apple's public
U.S. retail directory at most once per store-cache TTL, calculates great-circle distances, and overlays
deterministic simulated inventory. The offline mock provider remains available for automated tests and
development without network access.

Inventory snapshots are append-only, enabling later availability history. Alert checks and delivery
are intentionally separate. `NotificationProvider` is the seam for email, SMS, or push; the MVP only
persists alert subscriptions.
