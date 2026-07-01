package handler

import (
	"net/http"

	"finances-api/internal/service"
)

func (h *Handler) listTransactions(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	offset := parseInt(q.Get("offset"), 0)
	if offset < 0 {
		offset = 0
	}
	txs, err := h.Svc.ListTransactions(r.Context(), service.TxFilter{
		Month:    q.Get("month"),
		Category: q.Get("category"),
		Bank:     q.Get("bank"),
		Limit:    clampInt(parseInt(q.Get("limit"), 100), 1, 1000),
		Offset:   offset,
	})
	if err != nil {
		fail(w, err)
		return
	}
	writeJSON(w, http.StatusOK, txs)
}

type patchTxBody struct {
	Category *string `json:"category"`
	Reviewed *bool   `json:"reviewed"`
}

func (h *Handler) patchTransaction(w http.ResponseWriter, r *http.Request) {
	var b patchTxBody
	if !bind(w, r, &b) {
		return
	}
	updated, err := h.Svc.PatchTransaction(r.Context(), pathParam(r, "id"),
		service.PatchTx{Category: b.Category, Reviewed: b.Reviewed})
	if err != nil {
		fail(w, err)
		return
	}
	h.Hub.Broadcast(`{"source":"api"}`)
	writeJSON(w, http.StatusOK, map[string]any{"updated": updated})
}
