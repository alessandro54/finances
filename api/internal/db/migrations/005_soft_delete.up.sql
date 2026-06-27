-- Soft delete for transactions: the dedup sweep marks redundant rows instead of
-- removing them, so nothing is ever lost and rows stay recoverable.
ALTER TABLE transactions ADD COLUMN deleted_at TEXT;

--bun:split
CREATE INDEX IF NOT EXISTS idx_tx_deleted ON transactions(deleted_at);

--bun:split
-- Speeds up the dup-group scan (same purchase across re-captures).
CREATE INDEX IF NOT EXISTS idx_tx_dupkey ON transactions(bank, date, time, amount, currency);
