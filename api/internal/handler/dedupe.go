package handler

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/uptrace/bun"
)

// DedupeSQL soft-deletes duplicate transactions: within each
// (bank, date, time, amount, currency) group it keeps one row — the one with the
// most descriptive merchant (longest name), tie-broken by earliest created_at —
// and stamps deleted_at on the rest. Only complete rows (date+time+amount present)
// are ever considered, so partial/error rows are never auto-removed.
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
// Exported so tests can exercise it against an in-memory DB.
func Dedupe(ctx context.Context, db *bun.DB) (int64, error) {
	res, err := db.NewRaw(DedupeSQL).Exec(ctx)
	if err != nil {
		return 0, err
	}
	n, _ := res.RowsAffected()
	return n, nil
}

// postDedupe is the manual/n8n-cron trigger.
func (h *Handler) postDedupe(w http.ResponseWriter, r *http.Request) {
	n, err := Dedupe(r.Context(), h.DB)
	if err != nil {
		fail(w, err)
		return
	}
	if n > 0 {
		h.Hub.Broadcast(`{"source":"dedupe"}`)
	}
	writeJSON(w, http.StatusOK, map[string]any{"soft_deleted": n})
}

// StartDedupeSweeper runs the sweep shortly after boot, then every 6h, for the
// life of ctx. In-process cron — one less moving part than an external scheduler.
func (h *Handler) StartDedupeSweeper(ctx context.Context) {
	go func() {
		// small delay so migrations/boot settle first
		timer := time.NewTimer(30 * time.Second)
		defer timer.Stop()
		ticker := time.NewTicker(6 * time.Hour)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-timer.C:
			case <-ticker.C:
			}
			n, err := Dedupe(ctx, h.DB)
			if err != nil {
				log.Printf("dedupe sweep: %v", err)
				continue
			}
			if n > 0 {
				log.Printf("dedupe sweep: soft-deleted %d duplicate(s)", n)
				h.Hub.Broadcast(`{"source":"dedupe"}`)
			}
		}
	}()
}
