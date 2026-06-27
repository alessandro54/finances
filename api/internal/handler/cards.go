package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"

	"finances-api/internal/model"
)

func (h *Handler) listCards(w http.ResponseWriter, r *http.Request) {
	cards := []model.Card{}
	if err := h.DB.NewSelect().Model(&cards).Order("bank").Scan(r.Context()); err != nil {
		fail(w, err)
		return
	}
	writeJSON(w, http.StatusOK, cards)
}

type cardBody struct {
	Bank          string  `json:"bank"`
	Name          *string `json:"name"`
	CardLast4     *string `json:"card_last4"`
	CycleStartDay *int64  `json:"cycle_start_day"`
}

func (h *Handler) upsertCard(w http.ResponseWriter, r *http.Request) {
	var b cardBody
	if err := json.NewDecoder(r.Body).Decode(&b); err != nil {
		badRequest(w, "invalid body")
		return
	}
	bank := strings.TrimSpace(b.Bank)
	if bank == "" {
		badRequest(w, "bank is empty")
		return
	}
	day := int64(1)
	if b.CycleStartDay != nil {
		day = *b.CycleStartDay
	}
	day = int64(clampInt(int(day), 1, 28))

	card := &model.Card{Bank: bank, Name: b.Name, CardLast4: b.CardLast4, CycleStartDay: day}
	_, err := h.DB.NewInsert().Model(card).
		On("CONFLICT (bank) DO UPDATE").
		Set("name = EXCLUDED.name").
		Set("card_last4 = EXCLUDED.card_last4").
		Set("cycle_start_day = EXCLUDED.cycle_start_day").
		Exec(r.Context())
	if err != nil {
		fail(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

// deleteCard removes a card and any budgets scoped to it.
func (h *Handler) deleteCard(w http.ResponseWriter, r *http.Request) {
	bank := chi.URLParam(r, "bank")
	ctx := r.Context()
	if _, err := h.DB.NewDelete().Model((*model.Budget)(nil)).Where("card = ?", bank).Exec(ctx); err != nil {
		fail(w, err)
		return
	}
	res, err := h.DB.NewDelete().Model((*model.Card)(nil)).Where("bank = ?", bank).Exec(ctx)
	if err != nil {
		fail(w, err)
		return
	}
	n, _ := res.RowsAffected()
	writeJSON(w, http.StatusOK, map[string]any{"deleted": n})
}
