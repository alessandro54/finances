package handler

import (
	"context"
	"log"
	"net/http"
	"time"
)

// postDedupe is the manual/n8n-cron trigger for the soft-delete sweep.
func (h *Handler) postDedupe(w http.ResponseWriter, r *http.Request) {
	n, err := h.Svc.Dedupe(r.Context())
	if err != nil {
		fail(w, err)
		return
	}
	if n > 0 {
		h.Hub.Broadcast(`{"source":"dedupe"}`)
	}
	writeJSON(w, http.StatusOK, map[string]any{"soft_deleted": n})
}

// StartDedupeSweeper runs the sweep 30s after boot, then every 6h, for the life of
// ctx. In-process cron — one less moving part than an external scheduler.
func (h *Handler) StartDedupeSweeper(ctx context.Context) {
	go func() {
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
			n, err := h.Svc.Dedupe(ctx)
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
