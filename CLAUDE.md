# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Personal finance tracker, monorepo, three layers around one Turso (libSQL) database:

- **n8n** (`n8n/`) — INPUT layer. Bank mail (BBVA Outlook + Diners Gmail) → parse with Claude Sonnet (GPT-4o-mini fallback) → dedup → write to Turso → Telegram confirm. 12h backfill sweep re-fetches last 7 days, idempotent. Lives as an exported workflow JSON, not code.
- **api** (`api/`) — INTELLIGENCE layer. Go (chi router + Bun ORM) REST API reading/writing Turso, remote-only (pure-Go libsql driver, no CGO). Layered: `cmd/server` (entrypoint), `internal/db` (connection + migrations), `internal/model` (Bun models), `internal/handler` (router + handlers, one file per resource). Also the tool surface for a future LLM budget advisor.
- **web** (`web/`) — SvelteKit (Svelte 5 runes) dashboard → Vercel. Talks to `api` **server-side only** (API token never reaches the browser). Routes: `/` (transactions + stats + charts + inline recategorize + review modal), `/cards` (cards, billing cycles, per-cycle budgets), `/categories` (add/delete). Live updates via SSE (no polling). No auth gate yet.

Data flows one way into Turso (n8n writes), and the API + dash read/annotate it. The three parts deploy independently (n8n host, Dokku VM, Vercel) and share only the database + `API_TOKEN`.

## Commands

Whole stack (from repo root): `cp .env.example .env` (fill in), then `docker compose up --build`. Brings up api (8080), web dev server w/ HMR (5173), n8n (5678). Turso is remote — no DB container. `web` uses `web/Dockerfile.dev` (dev server); the prod `api/Dockerfile` is a multi-stage Go build → distroless static.

API (run from `api/`):
```bash
go run ./cmd/server   # needs TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, API_TOKEN in env/.env
go build ./...        # compile check
go vet ./...
go test ./...         # unit tests (in-memory SQLite via modernc.org/sqlite; no env/DB needed)
```
Config is loaded + validated in `internal/config`. Tests live in `api/tests/` (black-box): they open an in-memory SQLite, run the real Bun migrations, and exercise the cycle-window + budget-status SQL via the exported `handler.CycleWindow` / `handler.BudgetStatusCycleSQL`.

Web (run from `web/`, **Bun**): `bun run dev` (needs `web/.env`: API_BASE, API_TOKEN) · `bun run check` (svelte-check) · `bun run build` (vercel adapter). Two unrelated "Bun"s in this repo: the **Go Bun ORM** (api) and **Bun the JS runtime** (web).

## API architecture notes

- **Stack**: Go, chi router (stdlib `net/http`), Bun ORM over the pure-Go libsql remote driver (`tursodatabase/libsql-client-go`, CGO-free). Models in `internal/model`, handlers in `internal/handler` (`Handler` struct holds `*bun.DB`; one file per resource).
- **Auth**: all `/api/*` require `Authorization: Bearer $API_TOKEN` (chi middleware in `handler.auth`). `/health` is open. CORS permissive.
- **Migrations are the schema source of truth**: `internal/db/migrations/NNN_name.up.sql`, embedded via `//go:embed`, applied on boot by the Bun migrator (tracked in `bun_migrations`). Multi-statement files separate statements with `--bun:split` (the remote driver runs one statement per call). To add one: drop a higher-numbered `.up.sql`. There is no separate schema snapshot file.
- **Complex SQL uses Bun raw queries** (`db.NewRaw`) with **positional `?`** placeholders — Bun has no `bun.Named`, so repeat the arg each time a value recurs (see `CYCLE_WINDOW`/budget-status SQL in `internal/handler/budgets.go`). CRUD uses the Bun query builder.
- **Transactions keyed by `dedupe_id`** (the PK), set by n8n. The PATCH route takes `dedupe_id` as the path param. PATCH body is `{category?, reviewed?}` — blank category clears to NULL (→ "Others"), `reviewed:true` sets `confidence='high'`.
- **Cards + per-cycle budgets**: a `card` is keyed by `bank` (one per bank). Two cycle modes (`cycle_type`): `monthly` (`cycle_start_day`, day-of-month) or `days` (fixed-length: `cycle_length_days` from a `cycle_anchor` date — for banks like Interbank whose close drifts off a fixed day-of-month). Budgets are per-card per-cycle (`cycle_limit`); `budget-status?card=` evaluates over that card's billing cycle, summing only that card's transactions. `cycle_end` is **exclusive** (next cycle's start). No card → legacy calendar-month mode. Cycle SQL: `CycleWindow`/`CycleWindowDays` in `internal/handler/budgets.go`.
- **Real-time**: API has an SSE `Hub` (`internal/handler/events.go`); mutating handlers call `notify`. Web proxies it at `/events` (`routes/events/+server.ts`, server-side Bearer) → layout opens an `EventSource` → debounced `invalidateAll()`. n8n can push via `POST /api/notify` after writing Turso.
- **Currency is stored raw per row** (PEN/USD/EUR), never converted server-side. Conversion to soles happens client-side (`web/src/lib/format.ts`), seeded by **live FX** fetched server-side from `open.er-api.com` (`web/src/lib/server/fx.ts`, 1h cache, hardcoded fallback) and passed in via `setRates`.

## Web architecture notes

- **Stack**: SvelteKit + `adapter-vercel`, **Bun** runtime, Tailwind **v4** (`@tailwindcss/vite`, `@theme`/`@custom-variant dark` in `app.css` — no `tailwind.config`), Geist font (`@fontsource-variable/geist`). Dark mode via `.panel` + CSS tokens.
- **No Svelte stores**: state is runes (`$state`/`$derived`) + load/`data`; FX is a module-level object mutated once per page via `setRates`.
- **Server-only API access**: every call goes through `$lib/api` (injects `Authorization: Bearer $API_TOKEN`) in `+page.server.ts` loads/actions. The token lives in `web/.env` (`API_BASE`, `API_TOKEN`) — never shipped to the browser.
- **chi can't decode `%3A`**: `dedupe_id`s contain `:`, so the API's `pathParam()` does `url.PathUnescape`; the web client sends `encodeURIComponent(id)`. Don't remove either side.

## Deploy

Three independent targets sharing only Turso + `API_TOKEN`: **api** → Dokku VM via `api/Dockerfile` (multi-stage Go → distroless static nonroot); **web** → Vercel (`bun run build`, `adapter-vercel`); **n8n** → its own host. `docker-compose.yml` is for local dev only (`web/Dockerfile.dev` runs the dev server, not a prod build).

## n8n workflow

Community edition has no git sync. After editing the workflow in the n8n UI, export it (⋯ → Download, or `n8n export:workflow --id=<id> --output=bank-expense-tracker.json`), save as `n8n/bank-expense-tracker.json`, and commit. Exports contain credential IDs only, no secrets — safe to commit.
