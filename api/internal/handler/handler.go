// Package handler wires the HTTP router and holds the request handlers.
package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"net/url"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/uptrace/bun"
)

type Handler struct {
	DB    *bun.DB
	Token string
	Hub   *Hub
}

func New(db *bun.DB, token string) *Handler {
	return &Handler{DB: db, Token: token, Hub: NewHub()}
}

// Router builds the full HTTP handler: open /health, bearer-gated /api/*, CORS.
func (h *Handler) Router() http.Handler {
	r := chi.NewRouter()
	r.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte("ok"))
	})
	r.Route("/api", func(api chi.Router) {
		api.Use(h.auth)
		api.Get("/transactions", h.listTransactions)
		api.Patch("/transactions/{id}", h.patchTransaction)
		api.Get("/categories", h.listCategories)
		api.Post("/categories", h.createCategory)
		api.Delete("/categories/{name}", h.deleteCategory)
		api.Get("/cards", h.listCards)
		api.Post("/cards", h.upsertCard)
		api.Delete("/cards/{bank}", h.deleteCard)
		api.Get("/stats", h.stats)
		api.Get("/budgets", h.listBudgets)
		api.Put("/budgets", h.putBudget)
		api.Get("/budget-status", h.budgetStatus)
		api.Get("/events", h.events)      // SSE stream
		api.Post("/notify", h.notify)     // external writers (n8n) trigger a push
		api.Post("/dedupe", h.postDedupe) // soft-delete duplicate transactions on demand
	})
	return cors(r)
}

func (h *Handler) auth(next http.Handler) http.Handler {
	want := "Bearer " + h.Token
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") != want {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Authorization,Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func fail(w http.ResponseWriter, err error) {
	log.Printf("error: %v", err)
	http.Error(w, "error: "+err.Error(), http.StatusInternalServerError)
}

func badRequest(w http.ResponseWriter, msg string) {
	http.Error(w, msg, http.StatusBadRequest)
}

// pathParam reads a URL path param and percent-decodes it. chi does not decode
// %XX in path segments, but dedupe_ids/categories contain ':' etc. that the web
// sends via encodeURIComponent — so decode here to match stored values.
func pathParam(r *http.Request, key string) string {
	v := chi.URLParam(r, key)
	if dec, err := url.PathUnescape(v); err == nil {
		return dec
	}
	return v
}

func parseInt(s string, def int) int {
	if s == "" {
		return def
	}
	n, err := strconv.Atoi(s)
	if err != nil {
		return def
	}
	return n
}

func clampInt(n, lo, hi int) int {
	if n < lo {
		return lo
	}
	if n > hi {
		return hi
	}
	return n
}
