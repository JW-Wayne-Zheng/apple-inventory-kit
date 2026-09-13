# Orchard contributor guidance

These instructions apply to the entire repository. A more specific `AGENTS.md` takes precedence in its
subdirectory.

## Product boundaries

- Keep the product catalog limited to iPhone 18 Pro and iPhone 18 Pro Max unless the task explicitly changes scope.
- Preserve English and Simplified Chinese support for every user-visible string.
- Treat `demo` inventory as simulated and label it honestly. Real Apple Store locations do not imply real stock.
- Never add Apple cookies, account data, private headers, credentials, CAPTCHA workarounds, or aggressive polling.
- Keep checkout links on Apple's official domain and preserve the exact selected configuration when possible.

## Before editing

- Read `README.md`, the nearest `AGENTS.md`, and the relevant file under `docs/`.
- Inspect the working tree and preserve unrelated user changes.
- For Next.js work, follow `apps/web/AGENTS.md` and the versioned framework docs available in the installed package.

## Validation

Run the checks relevant to the change:

```bash
npm run lint
npm run typecheck
npm test
npm run build

cd apps/api
uv run ruff check .
uv run mypy app
uv run pytest
```

For search or mapping changes, also verify at least two geographically distant ZIP codes, such as `10001`
and `94105`, and confirm that the nearest store city, distance filter, and map all update.

## Handoff

- Summarize behavior changes and call out whether inventory is live or simulated.
- Report checks that passed and any checks that could not run.
- Update both `README.md` and `README.zh-CN.md` when setup or contributor instructions change.
