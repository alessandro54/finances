# finances-api

Rust (axum + libsql) REST API over the Turso expenses DB. Auto-migrates on boot.

## Run
```bash
cp .env.example .env   # fill TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, API_TOKEN
cargo run
```

## Auth
All `/api/*` require `Authorization: Bearer $API_TOKEN`. `/health` is open.

## Endpoints
| Method | Path | Notes |
|---|---|---|
| GET | `/health` | liveness |
| GET | `/api/transactions?month=YYYY-MM&category=&bank=&limit=&offset=` | rows, newest first |
| PATCH | `/api/transactions/:dedupe_id` | body `{ "category": "..." }` — recategorize |
| GET | `/api/categories` | `["groceries", ...]` |
| GET | `/api/stats?month=YYYY-MM` | `by_currency / by_category / by_bank / by_day` (omit month = all-time) |
| GET | `/api/budgets` | list |
| PUT | `/api/budgets` | upsert `{ category, currency?, monthly_limit }` |
| GET | `/api/budget-status?month=YYYY-MM` | per-category spend vs budget (default: current month) — **the LLM advisor's tool** |

## Budget advisor (future)
An LLM tool-calls `GET /api/budget-status` → gets `{category, limit, spent, remaining, over, pct}` per category → answers "should I buy food today?" → "no, food is 280/300 PEN this month." Later: wrap as an MCP server.

## Deploy (Dokku)
`docker build` from this dir; set runtime config:
```
dokku config:set finances-api TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... API_TOKEN=... PORT=8080
dokku ports:set finances-api http:80:8080 https:443:8080
```

## Notes
- `libsql` is built `remote`-only (no bundled SQLite C) → lean binary, ~10MB image-runtime RAM. If the `remote` feature name errors, run `cargo info libsql` and adjust the feature in `Cargo.toml`.
- Migrations: drop new `NNN_name.sql` in `migrations/`, add it to the `MIGRATIONS` array in `src/main.rs`. Applied once, tracked in `_migrations`.
