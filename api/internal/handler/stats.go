package handler

import (
	"net/http"
)

type currencyTotal struct {
	Currency *string `bun:"currency" json:"currency"`
	Total    float64 `bun:"total" json:"total"`
	Count    int64   `bun:"count" json:"count"`
}

type categoryTotal struct {
	Category *string `bun:"category" json:"category"`
	Currency *string `bun:"currency" json:"currency"`
	Total    float64 `bun:"total" json:"total"`
	Count    int64   `bun:"count" json:"count"`
}

type bankTotal struct {
	Bank     *string `bun:"bank" json:"bank"`
	Currency *string `bun:"currency" json:"currency"`
	Total    float64 `bun:"total" json:"total"`
}

type dayTotal struct {
	Date     *string `bun:"date" json:"date"`
	Currency *string `bun:"currency" json:"currency"`
	Total    float64 `bun:"total" json:"total"`
}

// stats: spend aggregates for a month (omit month = all-time). ?month bound by name.
func (h *Handler) stats(w http.ResponseWriter, r *http.Request) {
	month := r.URL.Query().Get("month")
	ctx := r.Context()

	byCurrency := []currencyTotal{}
	if err := h.DB.NewRaw(
		`SELECT currency, COALESCE(SUM(amount),0.0) AS total, COUNT(*) AS count FROM transactions
		 WHERE (? = '' OR strftime('%Y-%m', date) = ?) GROUP BY currency`, month, month,
	).Scan(ctx, &byCurrency); err != nil {
		fail(w, err)
		return
	}

	byCategory := []categoryTotal{}
	if err := h.DB.NewRaw(
		`SELECT category, currency, COALESCE(SUM(amount),0.0) AS total, COUNT(*) AS count FROM transactions
		 WHERE (? = '' OR strftime('%Y-%m', date) = ?) GROUP BY category, currency ORDER BY total DESC`, month, month,
	).Scan(ctx, &byCategory); err != nil {
		fail(w, err)
		return
	}

	byBank := []bankTotal{}
	if err := h.DB.NewRaw(
		`SELECT bank, currency, COALESCE(SUM(amount),0.0) AS total FROM transactions
		 WHERE (? = '' OR strftime('%Y-%m', date) = ?) GROUP BY bank, currency`, month, month,
	).Scan(ctx, &byBank); err != nil {
		fail(w, err)
		return
	}

	byDay := []dayTotal{}
	if err := h.DB.NewRaw(
		`SELECT date, currency, COALESCE(SUM(amount),0.0) AS total FROM transactions
		 WHERE (? = '' OR strftime('%Y-%m', date) = ?) GROUP BY date, currency ORDER BY date`, month, month,
	).Scan(ctx, &byDay); err != nil {
		fail(w, err)
		return
	}

	var monthVal any
	if month != "" {
		monthVal = month
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"month":       monthVal,
		"by_currency": byCurrency,
		"by_category": byCategory,
		"by_bank":     byBank,
		"by_day":      byDay,
	})
}
