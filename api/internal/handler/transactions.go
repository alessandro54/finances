package handler

import (
	"encoding/json"
	"net/http"
	"strings"


	"finances-api/internal/model"
)

func (h *Handler) listTransactions(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	month, category, bank := q.Get("month"), q.Get("category"), q.Get("bank")
	limit := clampInt(parseInt(q.Get("limit"), 100), 1, 1000)
	offset := parseInt(q.Get("offset"), 0)
	if offset < 0 {
		offset = 0
	}

	txs := []model.Transaction{}
	err := h.DB.NewSelect().Model(&txs).
		Where("(? = '' OR strftime('%Y-%m', date) = ?)", month, month).
		Where("(? = '' OR category = ?)", category, category).
		Where("(? = '' OR bank = ?)", bank, bank).
		Order("date DESC").
		Order("time DESC").
		Limit(limit).
		Offset(offset).
		Scan(r.Context())
	if err != nil {
		fail(w, err)
		return
	}
	writeJSON(w, http.StatusOK, txs)
}

type patchTxBody struct {
	Category *string `json:"category"`
	Reviewed *bool   `json:"reviewed"` // mark a flagged row reviewed → confidence='high'
}

func (h *Handler) patchTransaction(w http.ResponseWriter, r *http.Request) {
	id := pathParam(r, "id")
	var b patchTxBody
	if err := json.NewDecoder(r.Body).Decode(&b); err != nil {
		badRequest(w, "invalid body")
		return
	}
	ctx := r.Context()
	var updated int64

	if b.Category != nil {
		category := strings.TrimSpace(*b.Category)
		upd := h.DB.NewUpdate().Model((*model.Transaction)(nil)).Where("dedupe_id = ?", id)
		if category == "" {
			// Blank clears the category to NULL — the row falls under "Others".
			upd = upd.Set("category = NULL")
		} else {
			if _, err := h.DB.NewInsert().Model(&model.Category{Name: category}).Ignore().Exec(ctx); err != nil {
				fail(w, err)
				return
			}
			upd = upd.Set("category = ?", category)
		}
		res, err := upd.Exec(ctx)
		if err != nil {
			fail(w, err)
			return
		}
		n, _ := res.RowsAffected()
		updated += n
	}

	if b.Reviewed != nil && *b.Reviewed {
		res, err := h.DB.NewUpdate().Model((*model.Transaction)(nil)).
			Set("confidence = 'high'").Where("dedupe_id = ?", id).Exec(ctx)
		if err != nil {
			fail(w, err)
			return
		}
		n, _ := res.RowsAffected()
		updated += n
	}

	h.Hub.Broadcast(`{"source":"api"}`)
	writeJSON(w, http.StatusOK, map[string]any{"updated": updated})
}
