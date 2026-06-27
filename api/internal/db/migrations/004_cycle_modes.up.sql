-- Cards can have either a calendar-day cycle (closes the Nth each month) or a
-- fixed-length cycle (every N days from an anchor close date — drifts off calendar).
ALTER TABLE cards ADD COLUMN cycle_type TEXT NOT NULL DEFAULT 'monthly';

--bun:split
ALTER TABLE cards ADD COLUMN cycle_length_days INTEGER;

--bun:split
ALTER TABLE cards ADD COLUMN cycle_anchor TEXT;
