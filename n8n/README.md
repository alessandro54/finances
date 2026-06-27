# n8n — input layer

The "Bank Expense Tracker" workflow (id `bqZa0HNTcgHdjs8n`): bank notifications →
parse with Claude Sonnet (GPT-4o-mini fallback) → dedup → write to Turso → Telegram
confirm. Plus a 12h backfill sweep (re-fetches last 7 days, idempotent) so nothing
is lost on an outage.

## Track it in git
n8n community edition has no native git sync, so export manually after changes:

1. n8n → open **Bank Expense Tracker** → top-right **⋯** → **Download**.
2. Save the file here as `bank-expense-tracker.json`.
3. Commit.

(Or via the n8n CLI on the host: `n8n export:workflow --id=bqZa0HNTcgHdjs8n --output=bank-expense-tracker.json`.)

Secrets are **not** in the export — only credential IDs. Safe to commit.

## Email banks (BBVA, Diners) — automatic
triggers (BBVA Outlook / Diners Gmail / 12h schedule) → Extract Body → Check Seen (Turso) → Is New?
→ Build Claude Payload → Claude API (retry) ──ok→ Parse Response ─┐
                                              └err→ OpenAI API → Parse OpenAI ─┤
                                                                              → Build Turso Body → Write to Turso → Telegram

## Interbank — manual screenshot capture
Interbank has no email/SMS-to-email notifications, so it's captured manually from an
app screenshot, parsed by Claude **vision**. Two entry points, both feeding the same branch:

- **Interbank Telegram** (primary) — Telegram Trigger. Send a screenshot of the app
  transaction list to the bot. Guarded by `chatIds` (only the owner's chat) + photo-only.
- **Interbank Form** — n8n Form trigger with an image upload, at `<n8n-host>/form/interbank-manual`.

Trigger → Build Interbank Vision (Claude vision payload; prompt parses the app layout:
Spanish dates `Jue 25 Jun 6:19 pm`, am/pm→24h, missing year inferred, `S/`→PEN / `US$`→USD,
negative→positive, `En proceso`=pending; returns a JSON **array**) → Claude Vision API →
Parse Interbank (split array; `dedupe_id = interbank:<hash(merchant|date|time|amount|currency)>`)
→ shared Build Turso Body → Write to Turso → Telegram.

- `source = manual-interbank`. Dedup is the deterministic id + `INSERT OR IGNORE`, so
  re-sending an overlapping screenshot never double-inserts. The Telegram confirm reads the
  write's `affected_row_count` and reports **↩️ Already recorded** when a row was a duplicate.
- The **Claude Vision API** node needs the `Claude API Auth` credential attached in the UI
  (MCP can't set HTTP generic-auth credentials).
