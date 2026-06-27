package handler

import (
	"context"
	"database/sql"
	"encoding/json"
	"math"
	"net/http"

	"github.com/uptrace/bun"

	"finances-api/internal/model"
)

// CycleWindowSQL computes a card's billing-cycle window for a reference date.
// Positional args (Bun uses positional ?): ref, day, ref, day, ref, day.
// Returns one row (cstart, cend) where cend = cstart + 1 month; if ref day >=
// start_day the cycle started this month, else last month.
const CycleWindowSQL = `SELECT s AS cstart, date(s, '+1 month') AS cend FROM (
  SELECT date(CASE WHEN CAST(strftime('%d', ?) AS INTEGER) >= ?
    THEN strftime('%Y-%m-', ?) || printf('%02d', ?)
    ELSE strftime('%Y-%m-', date(?, '-1 month')) || printf('%02d', ?) END) AS s)`

// BudgetStatusCycleSQL: per-category spend vs limit for a card over a cycle window.
// Positional args: card, start, end, card.
const BudgetStatusCycleSQL = `SELECT b.category, b.currency, b.cycle_limit,
  COALESCE((SELECT SUM(t.amount) FROM transactions t
    WHERE t.category = b.category AND t.currency = b.currency
      AND t.bank = ? AND t.date >= ? AND t.date < ?), 0.0) AS spent
  FROM budgets b WHERE b.card = ? ORDER BY b.category, b.currency`

// Positional arg: month.
const budgetStatusMonthSQL = `SELECT b.category, b.currency, b.cycle_limit,
  COALESCE((SELECT SUM(t.amount) FROM transactions t
    WHERE t.category = b.category AND t.currency = b.currency
      AND strftime('%Y-%m', t.date) = ?), 0.0) AS spent
  FROM budgets b WHERE b.card = '' ORDER BY b.category, b.currency`

// StatusRow scans the 4-column budget-status query.
type StatusRow struct {
	Category   string  `bun:"category"`
	Currency   string  `bun:"currency"`
	CycleLimit float64 `bun:"cycle_limit"`
	Spent      float64 `bun:"spent"`
}

// CycleWindow returns [start, end) for a card cycle. Exported for tests.
func CycleWindow(ctx context.Context, db *bun.DB, ref string, day int) (string, string, error) {
	var cr struct {
		Start string `bun:"cstart"`
		End   string `bun:"cend"`
	}
	err := db.NewRaw(CycleWindowSQL, ref, day, ref, day, ref, day).Scan(ctx, &cr)
	return cr.Start, cr.End, err
}

func (h *Handler) listBudgets(w http.ResponseWriter, r *http.Request) {
	budgets := []model.Budget{}
	err := h.DB.NewSelect().Model(&budgets).
		Order("card").Order("category").Order("currency").Scan(r.Context())
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
	if err := json.NewDecoder(r.Body).Decode(&b); err != nil {
		badRequest(w, "invalid body")
		return
	}
	ctx := r.Context()
	card := ""
	if b.Card != nil {
		card = *b.Card
	}
	currency := "PEN"
	if b.Currency != nil && *b.Currency != "" {
		currency = *b.Currency
	}
	if _, err := h.DB.NewInsert().Model(&model.Category{Name: b.Category}).Ignore().Exec(ctx); err != nil {
		fail(w, err)
		return
	}
	bud := &model.Budget{Card: card, Category: b.Category, Currency: currency, CycleLimit: b.CycleLimit}
	_, err := h.DB.NewInsert().Model(bud).
		On("CONFLICT (card, category, currency) DO UPDATE").
		Set("cycle_limit = EXCLUDED.cycle_limit").
		Exec(ctx)
	if err != nil {
		fail(w, err)
		return
	}
	h.Hub.Broadcast(`{"source":"api"}`)
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

// budgetStatus is the LLM advisor's tool. With ?card= it evaluates over that card's
// current billing cycle (summing only that card's transactions); without, legacy month mode.
func (h *Handler) budgetStatus(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	ctx := r.Context()
	card := q.Get("card")

	if card == "" {
		month := q.Get("month")
		if month == "" {
			if err := h.DB.NewRaw("SELECT strftime('%Y-%m','now')").Scan(ctx, &month); err != nil {
				fail(w, err)
				return
			}
		}
		rows := []StatusRow{}
		if err := h.DB.NewRaw(budgetStatusMonthSQL, month).Scan(ctx, &rows); err != nil {
			fail(w, err)
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"month": month, "budgets": budgetJSON(rows)})
		return
	}

	var day int
	err := h.DB.NewSelect().Model((*model.Card)(nil)).
		Column("cycle_start_day").Where("bank = ?", card).Scan(ctx, &day)
	if err == sql.ErrNoRows {
		badRequest(w, "unknown card: "+card)
		return
	} else if err != nil {
		fail(w, err)
		return
	}
	day = clampInt(day, 1, 28)

	ref := q.Get("date")
	if ref == "" {
		ref = "now"
	}
	start, end, err := CycleWindow(ctx, h.DB, ref, day)
	if err != nil {
		fail(w, err)
		return
	}

	rows := []StatusRow{}
	err = h.DB.NewRaw(BudgetStatusCycleSQL, card, start, end, card).Scan(ctx, &rows)
	if err != nil {
		fail(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"card":        card,
		"cycle_start": start,
		"cycle_end":   end,
		"budgets":     budgetJSON(rows),
	})
}

func budgetJSON(rows []StatusRow) []map[string]any {
	out := []map[string]any{}
	for _, b := range rows {
		pct := 0.0
		if b.CycleLimit > 0 {
			pct = math.Round(b.Spent / b.CycleLimit * 100)
		}
		out = append(out, map[string]any{
			"category":  b.Category,
			"currency":  b.Currency,
			"limit":     b.CycleLimit,
			"spent":     b.Spent,
			"remaining": b.CycleLimit - b.Spent,
			"over":      b.Spent > b.CycleLimit,
			"pct":       pct,
		})
	}
	return out
}
