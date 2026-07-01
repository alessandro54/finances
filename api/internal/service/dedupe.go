package service

import "context"

// DedupeSQL soft-deletes duplicate transactions: within each
// (bank, date, time, amount, currency) group it keeps the row with the most
// descriptive merchant (longest name, tie-broken by earliest created_at) and
// stamps deleted_at on the rest. Only complete rows (date+time+amount present)
// are considered, so partial/error rows are never auto-removed.
const DedupeSQL = `UPDATE transactions SET deleted_at = datetime('now')
WHERE dedupe_id IN (
  SELECT dedupe_id FROM (
    SELECT dedupe_id,
      ROW_NUMBER() OVER (
        PARTITION BY bank, date, time, amount, currency
        ORDER BY length(COALESCE(merchant_clean, merchant, '')) DESC,
                 created_at ASC, dedupe_id ASC
      ) AS rn
    FROM transactions
    WHERE deleted_at IS NULL
      AND date IS NOT NULL AND time IS NOT NULL AND amount IS NOT NULL
  ) WHERE rn > 1
)`

// Dedupe runs the soft-delete sweep once and returns how many rows it marked.
func (s *Service) Dedupe(ctx context.Context) (int64, error) {
	res, err := s.DB.NewRaw(DedupeSQL).Exec(ctx)
	if err != nil {
		return 0, err
	}
	n, _ := res.RowsAffected()
	return n, nil
}
