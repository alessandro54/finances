CREATE TABLE IF NOT EXISTS transactions (
  dedupe_id        TEXT PRIMARY KEY,
  date             TEXT,
  time             TEXT,
  bank             TEXT,
  card_last4       TEXT,
  amount           REAL,
  currency         TEXT,
  merchant         TEXT,
  merchant_clean   TEXT,
  transaction_type TEXT,
  channel          TEXT,
  confidence       TEXT,
  raw_text         TEXT,
  source           TEXT,
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

CREATE INDEX IF NOT EXISTS idx_tx_date     ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_tx_category ON transactions(category);
