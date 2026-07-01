package handler

import (
	"errors"
	"net/http"

	"finances-api/internal/service"
)

func (h *Handler) listCards(w http.ResponseWriter, r *http.Request) {
	cards, err := h.Svc.ListCards(r.Context())
	if err != nil {
		fail(w, err)
		return
	}
	writeJSON(w, http.StatusOK, cards)
}

type cardBody struct {
	Bank            string  `json:"bank"`
	Name            *string `json:"name"`
	CardLast4       *string `json:"card_last4"`
	CycleStartDay   *int64  `json:"cycle_start_day"`
	CycleType       *string `json:"cycle_type"`
	CycleLengthDays *int64  `json:"cycle_length_days"`
	CycleAnchor     *string `json:"cycle_anchor"`
}

func (h *Handler) upsertCard(w http.ResponseWriter, r *http.Request) {
	var b cardBody
	if !bind(w, r, &b) {
		return
	}
	err := h.Svc.UpsertCard(r.Context(), service.CardInput(b))
	if errors.Is(err, service.ErrEmptyName) {
		badRequest(w, "bank is empty")
		return
	}
	if err != nil {
		fail(w, err)
		return
	}
	h.Hub.Broadcast(`{"source":"api"}`)
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

func (h *Handler) deleteCard(w http.ResponseWriter, r *http.Request) {
	n, err := h.Svc.DeleteCard(r.Context(), pathParam(r, "bank"))
	if err != nil {
		fail(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"deleted": n})
}
