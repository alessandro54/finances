CREATE TABLE IF NOT EXISTS budgets (
  category      TEXT NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'PEN',
  monthly_limit REAL NOT NULL,
  created_at    TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (category, currency)
);
