# finances

Personal finance control. Monorepo.

```
finances/
  api/   Go (chi + Bun ORM) REST API — the "intelligence" layer. Reads/writes Turso.
         Deploy to your own VM (Dokku). Also the tool surface for a future LLM budget advisor.
  web/   SvelteKit dashboard — deploy to Vercel. Talks to api/ server-side (token hidden).
  n8n/   Exported n8n workflow (bank-mail + Interbank screenshots → parse → Turso). The "input" layer.
```

## Architecture
```
n8n (INPUT: capture bank mail, parse w/ Claude→GPT fallback, dedup)  ─┐
                                                                       ▼
                                                                    Turso (libSQL store)
                                                                       ▲
                              Rust API (INTELLIGENCE) ─────────────────┘
                                ├─ GET /api/transactions, /stats, /categories
                                ├─ PATCH /api/transactions/:dedupe_id  (recategorize)
                                ├─ GET/PUT /api/budgets
                                └─ GET /api/budget-status  ← LLM advisor's tool
                                     ▲                          ▲
                          SvelteKit dash (Vercel)        LLM budget advisor (tool-calls the API)
```

Currencies (PEN/USD) are stored raw per row; convert client-side in the dash.

## Quick start
- `api/` — see `api/README.md` / `api/.env.example`. `go run ./cmd/server`.
- DB — schema auto-migrates on API boot from `api/internal/db/migrations/*.up.sql` (Bun migrator). No manual init.
- `web/` — see `web/README.md`.
