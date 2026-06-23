# n8n — input layer

The "Bank Expense Tracker" workflow: bank mail (BBVA Outlook + Diners Gmail) → parse with
Claude Sonnet (GPT-4o-mini fallback) → dedup → write to Turso → Telegram confirm. Plus a
12h backfill sweep (re-fetches last 7 days, idempotent) so nothing is lost on an outage.

## Track it in git
n8n community edition has no native git sync, so export manually after changes:

1. n8n → open **Bank Expense Tracker** → top-right **⋯** → **Download**.
2. Save the file here as `bank-expense-tracker.json`.
3. Commit.

(Or via the n8n CLI on the host: `n8n export:workflow --id=<workflowId> --output=bank-expense-tracker.json`.)

Secrets are **not** in the export — only credential IDs. Safe to commit.

## Nodes (high level)
triggers (BBVA / Gmail / 12h schedule) → Extract Body → Check Seen (Turso) → Is New?
→ Build Payload → Claude API (retry) ──ok→ Parse Response ─┐
                                       └err→ OpenAI API → Parse OpenAI ─┤
                                                                        → Build Turso Body → Write to Turso → Telegram
