package handler

import (
	"errors"
	"net/http"

	"finances-api/internal/service"
)

func (h *Handler) listBudgets(w http.ResponseWriter, r *http.Request) {
	budgets, err := h.Svc.ListBudgets(r.Context())
	if err != nil {
		fail(w, err)
		return
	}
	writeJSON(w, http.StatusOK, budgets)
}

type budgetBody struct {
	Card       *string `json:"card"`
	Category   string  `json:"category"`
	Currency   *string `json:"currency"`
	CycleLimit float64 `json:"cycle_limit"`
}

func (h *Handler) putBudget(w http.ResponseWriter, r *http.Request) {
	var b budgetBody
	if !bind(w, r, &b) {
		return
	}
	in := service.BudgetInput{Category: b.Category, CycleLimit: b.CycleLimit}
	if b.Card != nil {
		in.Card = *b.Card
	}
	if b.Currency != nil {
		in.Currency = *b.Currency
	}
	if err := h.Svc.PutBudget(r.Context(), in); err != nil {
		fail(w, err)
		return
	}
	h.Hub.Broadcast(`{"source":"api"}`)
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

// budgetStatus is the LLM advisor's tool. ?card= evaluates over that card's current
// billing cycle; without it, legacy calendar-month mode.
func (h *Handler) budgetStatus(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	res, err := h.Svc.BudgetStatus(r.Context(), q.Get("card"), q.Get("month"), q.Get("date"))
	if errors.Is(err, service.ErrUnknownCard) {
		badRequest(w, "unknown card: "+q.Get("card"))
		return
	}
	if err != nil {
		fail(w, err)
		return
	}
	writeJSON(w, http.StatusOK, res)
}
