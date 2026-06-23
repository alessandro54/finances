-- Full schema snapshot (reference + manual init).
-- Canonical, auto-applied migrations live in api/migrations/ and run on API boot.
-- Manual init:  turso db shell <db-name> < db/schema.sql

CREATE TABLE IF NOT EXISTS transactions (
  dedupe_id        TEXT PRIMARY KEY,
  date             TEXT,            -- 'YYYY-MM-DD'
  time             TEXT,            -- 'HH:MM' or NULL
  bank             TEXT,
  card_last4       TEXT,
  amount           REAL,
  currency         TEXT,            -- 'PEN' | 'USD' | 'EUR'
  merchant         TEXT,            -- raw, verbatim from notification
  merchant_clean   TEXT,            -- normalized
  transaction_type TEXT,
  channel          TEXT,
  confidence       TEXT,            -- 'high' | 'medium' | 'low'
  raw_text         TEXT,
  source           TEXT,            -- 'mail-bbva' | 'mail-diners' | ...
  category         TEXT,
  created_at       TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS errors (
  dedupe_id  TEXT PRIMARY KEY,
  error      TEXT,
  reason     TEXT,
  raw_text   TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  name       TEXT PRIMARY KEY,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS budgets (
  category      TEXT NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'PEN',
  monthly_limit REAL NOT NULL,
  created_at    TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (category, currency)
);

CREATE INDEX IF NOT EXISTS idx_tx_date     ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_tx_category ON transactions(category);
