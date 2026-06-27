-- Cards: one per bank for now (bank is the natural key). Holds the credit-card
-- billing cycle so budgets can be evaluated per cycle instead of per calendar month.
CREATE TABLE IF NOT EXISTS cards (
  bank            TEXT PRIMARY KEY,
  name            TEXT,
  card_last4      TEXT,
  cycle_start_day INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT DEFAULT (datetime('now'))
);

--bun:split
-- Rebuild budgets to be per-card and per-cycle.
-- card = '' means a legacy / not-card-scoped budget (the old monthly rows).
CREATE TABLE IF NOT EXISTS budgets_v2 (
  card        TEXT NOT NULL DEFAULT '',
  category    TEXT NOT NULL,
  currency    TEXT NOT NULL DEFAULT 'PEN',
  cycle_limit REAL NOT NULL,
  created_at  TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (card, category, currency)
);

--bun:split
INSERT OR IGNORE INTO budgets_v2 (card, category, currency, cycle_limit, created_at)
  SELECT '', category, currency, monthly_limit, created_at FROM budgets;

--bun:split
DROP TABLE budgets;

--bun:split
ALTER TABLE budgets_v2 RENAME TO budgets;
