# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Personal finance tracker, monorepo, three layers around one Turso (libSQL) database:

- **n8n** (`n8n/`) — INPUT layer. Bank mail (BBVA Outlook + Diners Gmail) → parse with Claude Sonnet (GPT-4o-mini fallback) → dedup → write to Turso → Telegram confirm. 12h backfill sweep re-fetches last 7 days, idempotent. Lives as an exported workflow JSON, not code.
- **api** (`api/`) — INTELLIGENCE layer. Rust (axum + libsql) REST API reading/writing Turso. Single file: `api/src/main.rs`. Also the tool surface for a future LLM budget advisor.
- **web** (`web/`) — SvelteKit (Svelte 5 runes) dashboard → Vercel. Talks to `api` **server-side only** (API token never reaches the browser). Routes: `/` (transactions + stats + inline recategorize) and `/categories` (add/delete). No auth gate yet.

Data flows one way into Turso (n8n writes), and the API + dash read/annotate it. The three parts deploy independently (n8n host, Dokku VM, Vercel) and share only the database + `API_TOKEN`.

## Commands

Whole stack (from repo root): `cp .env.example .env` (fill in), then `docker compose up --build`. Brings up api (8080), web dev server w/ HMR (5173), n8n (5678). Turso is remote — no DB container. `web` uses `web/Dockerfile.dev` (dev server); the root prod Dockerfile is rust-only.

API (run from `api/`):
```bash
cargo run                 # needs TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, API_TOKEN in env/.env
cargo check               # fast compile check (no env needed)
cargo build --release     # release profile: strip + lto + codegen-units=1
docker build -t finances-api .   # Dokku deploy
```

Web (run from `web/`): `npm run dev` (needs `web/.env`: API_BASE, API_TOKEN) · `npm run check` (svelte-check) · `npm run build` (vercel adapter).

No tests exist yet. Manual DB init (migrations otherwise auto-apply on boot): `turso db shell <db> < db/schema.sql`.

## API architecture notes

- **Auth**: all `/api/*` routes require `Authorization: Bearer $API_TOKEN` (middleware in `auth`). `/health` is open. CORS is permissive.
- **Migrations are code-driven**: SQL files in `api/migrations/`, registered in the `MIGRATIONS` array in `main.rs`, applied once on boot, tracked in `_migrations` table. To add one: drop `NNN_name.sql` in `migrations/` AND add it to the array — both, or it won't run. `db/schema.sql` is a hand-kept reference snapshot, NOT the source of truth.
- **libsql is `remote`-only** (`default-features = false, features = ["remote"]`) — no bundled SQLite C build, keeps the binary lean/musl-friendly. If a feature name errors on build, run `cargo info libsql` and adjust `Cargo.toml`.
- **Transactions keyed by `dedupe_id`** (the PK), set by n8n. The PATCH recategorize route takes `dedupe_id` as the path param, not a numeric id.
- **Currency is stored raw per row** (PEN/USD/EUR), never converted server-side. Conversion happens client-side in the dash.
- `GET /api/budget-status` is purpose-built as the future LLM advisor's tool: returns `{category, limit, spent, remaining, over, pct}` per category for a month (defaults to current).
- Errors: any handler returning `Result<_, AppError>` maps `anyhow::Error` → 500 with the message logged via tracing.

## n8n workflow

Community edition has no git sync. After editing the workflow in the n8n UI, export it (⋯ → Download, or `n8n export:workflow --id=<id> --output=bank-expense-tracker.json`), save as `n8n/bank-expense-tracker.json`, and commit. Exports contain credential IDs only, no secrets — safe to commit.
