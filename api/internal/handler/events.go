package handler

import (
	"net/http"
	"sync"
	"time"
)

// Hub is a tiny in-memory SSE fan-out: subscribers register a channel and get
// every Broadcast. Used to push "data changed" to connected dashboards.
type Hub struct {
	mu   sync.Mutex
	subs map[chan string]struct{}
}

func NewHub() *Hub {
	return &Hub{subs: make(map[chan string]struct{})}
}

func (h *Hub) subscribe() chan string {
	ch := make(chan string, 8)
	h.mu.Lock()
	h.subs[ch] = struct{}{}
	h.mu.Unlock()
	return ch
}

func (h *Hub) unsubscribe(ch chan string) {
	h.mu.Lock()
	if _, ok := h.subs[ch]; ok {
		delete(h.subs, ch)
		close(ch)
	}
	h.mu.Unlock()
}

// Broadcast is non-blocking: a slow/full subscriber simply misses this tick
// (it will re-fetch on the next event or reconnect).
func (h *Hub) Broadcast(msg string) {
	h.mu.Lock()
	for ch := range h.subs {
		select {
		case ch <- msg:
		default:
		}
	}
	h.mu.Unlock()
}

// events streams Server-Sent Events; emits `change` on every Broadcast plus a
// heartbeat comment to keep proxies/connections alive.
func (h *Handler) events(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	ch := h.Hub.subscribe()
	defer h.Hub.unsubscribe(ch)

	ctx := r.Context()
	w.Write([]byte(": connected\n\n"))
	flusher.Flush()

	ticker := time.NewTicker(25 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case msg := <-ch:
			w.Write([]byte("event: change\ndata: " + msg + "\n\n"))
			flusher.Flush()
		case <-ticker.C:
			w.Write([]byte(": ping\n\n"))
			flusher.Flush()
		}
	}
}

// notify lets an external writer (n8n, after writing to Turso) trigger a push.
func (h *Handler) notify(w http.ResponseWriter, r *http.Request) {
	h.Hub.Broadcast(`{"source":"external"}`)
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}
