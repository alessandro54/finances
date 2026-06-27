# finances-api

Go (chi + Bun ORM) REST API over the Turso (libSQL) expenses DB. Remote-only
(pure-Go libsql driver, no CGO). Auto-migrates on boot.

## Run
```bash
cp .env.example .env   # fill TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, API_TOKEN
go run ./cmd/server
```
`go test ./...` runs the unit tests (in-memory SQLite via `modernc.org/sqlite`; no env/DB needed).

## Layout
```
cmd/server/main.go        entrypoint: open DB, migrate, serve
internal/
  db/                     Bun connection + migrations (source of truth)
    migrations/*.up.sql   embedded; applied once, tracked in bun_migrations
  model/                  Bun models (one struct per table)
  handler/                chi router + handlers (one file per resource)
tests/                    black-box tests against internal/*
```

## Auth
All `/api/*` require `Authorization: Bearer $API_TOKEN`. `/health` is open. CORS is permissive.

## Endpoints
| Method | Path | Notes |
|---|---|---|
| GET | `/health` | liveness |
| GET | `/api/transactions?month=YYYY-MM&category=&bank=&limit=&offset=` | rows, newest first |
| PATCH | `/api/transactions/:dedupe_id` | body `{ "category"?, "reviewed"? }`. Blank category → NULL (→ "Others"); `reviewed:true` → confidence='high' |
| GET | `/api/categories` | `["groceries", ...]` |
| POST | `/api/categories` | `{ "name" }` — create (idempotent) |
| DELETE | `/api/categories/:name` | delete; transactions using it set to NULL |
| GET | `/api/cards` | `[{ bank, name, card_last4, cycle_start_day }]` |
| POST | `/api/cards` | upsert `{ bank, name?, card_last4?, cycle_start_day? }` (one per bank; day 1–28) |
| DELETE | `/api/cards/:bank` | delete card + its budgets |
| GET | `/api/stats?month=YYYY-MM` | `by_currency / by_category / by_bank / by_day` (omit month = all-time) |
| GET | `/api/budgets` | `[{ card, category, currency, cycle_limit }]` |
| PUT | `/api/budgets` | upsert `{ card?, category, currency?, cycle_limit }` |
| GET | `/api/budget-status?card=BBVA&date=YYYY-MM-DD` | spend vs budget **over the card's billing cycle** (date default today). Without `card`: legacy month mode (`?month=`). **The LLM advisor's tool** |

## Migrations
Bun migrations in `internal/db/migrations/NNN_name.up.sql`, embedded via `//go:embed`
and applied on boot (tracked in `bun_migrations`). They are the schema source of truth.
Multi-statement files separate statements with `--bun:split` (the remote driver runs one
statement per call). Add a new migration → drop a higher-numbered `.up.sql`.

## Deploy (Dokku)
`docker build` from this dir (multi-stage Go → distroless static). Runtime config:
```
dokku config:set finances-api TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... API_TOKEN=... PORT=8080
dokku ports:set finances-api http:80:8080 https:443:8080
```
