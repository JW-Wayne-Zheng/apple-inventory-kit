# Orchard

[English](README.md) | [简体中文](README.zh-CN.md)

A polished iPhone 18 Pro pickup availability tracker. Enter a ZIP code, choose an exact Pro or Pro Max
configuration, compare nearby stores, sort/filter results, inspect store details, check availability,
filter by a 25/50/100-mile radius, switch between English and Chinese, and continue to Apple’s official
configuration page for pickup and guest checkout.
A focused “蹲库存” mode checks every 60 seconds while the page is open
and uses browser notifications when a store becomes available. Orchard is independent and
**not affiliated with Apple Inc.**

The default demo mode resolves U.S. ZIP codes with the free Zippopotam.us service and uses Apple's public
store directory for real store names, addresses, coordinates, and distances. Inventory status remains
clearly labeled demonstration data. Live Apple inventory access is experimental because Apple does not
offer a stable, documented public retail inventory API.
The current catalog is intentionally limited to iPhone 18 Pro and iPhone 18 Pro Max, including all
four finishes and all four storage capacities.

## Architecture

- **Web:** Next.js, React, TypeScript, Tailwind CSS, shadcn-style local UI components, TanStack Query,
  MapLibre GL JS, React Hook Form, and Zod
- **API:** FastAPI, Pydantic, async HTTPX, SQLAlchemy 2, Alembic, and structured JSON logging
- **Data:** PostgreSQL for products/stores/history/alerts; Redis for short-lived inventory and metadata
- **Providers:** a normalized `InventoryProvider` boundary with complete mock and experimental Apple
  implementations
- **Reliability:** cache coalescing, per-client refresh limits, stale-on-provider-error, strict outbound
  timeouts, no aggressive retries

See [architecture](docs/architecture.md), [API reference](docs/api.md), and
[Apple provider research](docs/apple-provider.md).

## Repository layout

```text
apps/
  api/                  FastAPI service, migrations, and tests
    app/
      api/routes/       HTTP boundary
      providers/        Apple and mock adapters
      services/         product, store, inventory, cache, throttling
      repositories/     PostgreSQL persistence
      schemas/          normalized public domain models
  web/                  Next.js application and component tests
packages/
  shared/               shared Zod contracts
docs/                   architecture, API, and Apple integration notes
docker-compose.yml      web, API, PostgreSQL, Redis
```

## Start with Docker

Requirements: Docker Desktop with Compose.

```bash
cp .env.example .env
docker compose up --build
```

- Web: <http://localhost:3000>
- API: <http://localhost:8001>
- API docs: <http://localhost:8001/docs>

Demo mode is the default. Try ZIP `10001`, `94105`, or `90210`; each returns the appropriate nearby Apple
Stores instead of a fixed region.

## Run locally

The API targets Python 3.12+ and the web app targets Node 20+.

```bash
npm install
npm run dev
```

In a second terminal:

```bash
cd apps/api
uv sync --extra dev
uv run uvicorn app.main:app --reload
```

Run PostgreSQL and Redis separately or use their Compose services. If Redis is unavailable, development
falls back to a process-local TTL cache. Set `PERSIST_INVENTORY=false` when intentionally running without
PostgreSQL.

## Database migrations

The API container runs `alembic upgrade head` on startup. Manually:

```bash
cd apps/api
uv run alembic upgrade head
```

The initial migration creates products, generic product variants, stores, append-only inventory snapshots,
and alert subscriptions.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build

cd apps/api
uv run ruff check .
uv run mypy app
uv run pytest --cov=app
```

Automated tests never call Apple. They cover response parsing, normalization, caching/coalescing, input
validation, API behavior, UI status presentation, and critical search validation.

## Contributing with Codex

Open the repository folder as a Codex project and begin with a focused prompt such as:

```text
Read AGENTS.md and README.md first. Inspect the current working tree before editing.
Implement <your change>, preserve the bilingual UI, and run the documented quality checks.
```

Repository-specific guidance for coding agents lives in [`AGENTS.md`](AGENTS.md). Before handing work back,
keep English and Chinese copy aligned, avoid committing `.env` or credentials, and verify both an East Coast
and a West Coast ZIP when changing location behavior. Small, focused pull requests are easiest to review.

## Configuration

Copy `.env.example`; every setting is documented there. Notable values:

| Variable | Default/role |
| --- | --- |
| `INVENTORY_PROVIDER` | `demo`; real store locations plus simulated stock. `mock` is offline-only, and `apple` is experimental |
| `POSTAL_LOOKUP_BASE_URL` | free ZIP-to-coordinate lookup used by demo mode |
| `APPLE_GRAPHQL_PATH`, `APPLE_STORE_SEARCH_QUERY_ID` | Apple's public retail-directory query configuration |
| `APPLE_FULFILLMENT_PATH` | externalized undocumented route |
| `INVENTORY_CACHE_TTL_SECONDS` | 60 seconds |
| `INVENTORY_STALE_TTL_SECONDS` | 15-minute failure fallback |
| `STORE_CACHE_TTL_SECONDS` | 24 hours |
| `PRODUCT_CACHE_TTL_SECONDS` | 6 hours |
| `REFRESH_LIMIT_REQUESTS` | 6 refreshes per client/window |
| `DATABASE_URL`, `REDIS_URL` | service connections |
| `NEXT_PUBLIC_MAP_TILE_URL` | raster basemap template; defaults to OpenStreetMap for light local use |

Never add cookies, Apple Account information, private request headers, or secrets to configuration.

## Apple integration and limitations

Apple's storefront currently advertises an undocumented fulfillment endpoint using numbered part-number
parameters and a location. Direct access was blocked in the verification environment, so the adapter is
defensive and disabled by default. Real storefront part discovery is not automated. See the research note
for the observed route, sanitized response, mapping, safeguards, and legal/reliability considerations.

Important limitations:

- Demo inventory statuses are simulated; store locations and distances come from the ZIP centroid and Apple's
  public retail directory. The default OpenStreetMap tile service is suitable for light interactive use but has
  no SLA; configure a production tile provider before significant traffic.
- Alert records persist, but server-side notification delivery and recurring checks are intentionally stubbed behind an interface.
- Browser inventory watching only runs while the page remains open.
- In-process request coalescing and rate limits must move to Redis for a horizontally scaled deployment.
- Authentication is not included; the alerts list is an operator-level MVP endpoint.
- Store hours and real product metadata depend on upstream coverage.

## Roadmap

1. Add a compliant, periodically reviewed part-number catalog ingestion pipeline.
2. Add user authentication and ownership/privacy controls for alert subscriptions.
3. Add a Redis-backed distributed lock and shared sliding-window refresh limiter.
4. Run alert checks in a lightweight worker and connect a transactional email provider.
5. Add inventory history charts, restock probability, and broader end-to-end browser coverage.
