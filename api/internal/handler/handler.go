// Package handler wires the HTTP router. Controllers are thin: decode the
// request, delegate to the service, write the response. Helpers live in util.go,
// middleware in middleware.go, one controller file per resource.
package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/uptrace/bun"

	"finances-api/internal/service"
)

type Handler struct {
	Svc   *service.Service
	Token string
	Hub   *Hub
}

func New(db *bun.DB, token string) *Handler {
	return &Handler{Svc: service.New(db), Token: token, Hub: NewHub()}
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
