package service

import (
	"context"
	"database/sql"
	"math"

	"finances-api/internal/model"
)

// CycleWindowSQL computes a card's billing-cycle window for a reference date.
// Positional args (Bun uses positional ?): ref, day, ref, day, ref, day.
const CycleWindowSQL = `SELECT s AS cstart, date(s, '+1 month') AS cend FROM (
  SELECT date(CASE WHEN CAST(strftime('%d', ?) AS INTEGER) >= ?
    THEN strftime('%Y-%m-', ?) || printf('%02d', ?)
    ELSE strftime('%Y-%m-', date(?, '-1 month')) || printf('%02d', ?) END) AS s)`

// DaysCycleWindowSQL: fixed-length cycle window. Positional args:
// anchor, ref, anchor, length, length, length.
const DaysCycleWindowSQL = `WITH w AS (
  SELECT date(?, '+' || (CAST((julianday(?) - julianday(?)) / ? AS INTEGER) * ?) || ' days') AS cstart
)
SELECT cstart, date(cstart, '+' || ? || ' days') AS cend FROM w`

// BudgetStatusCycleSQL: per-category spend vs limit for a card over a cycle window.
// Positional args: card, start, end, card.
const BudgetStatusCycleSQL = `SELECT b.category, b.currency, b.cycle_limit,
  COALESCE((SELECT SUM(t.amount) FROM transactions t
    WHERE t.deleted_at IS NULL AND t.category = b.category AND t.currency = b.currency
      AND t.bank = ? AND t.date >= ? AND t.date < ?), 0.0) AS spent
  FROM budgets b WHERE b.card = ? ORDER BY b.category, b.currency`

// budgetStatusMonthSQL: legacy calendar-month mode. Positional arg: month.
const budgetStatusMonthSQL = `SELECT b.category, b.currency, b.cycle_limit,
  COALESCE((SELECT SUM(t.amount) FROM transactions t
    WHERE t.deleted_at IS NULL AND t.category = b.category AND t.currency = b.currency
      AND strftime('%Y-%m', t.date) = ?), 0.0) AS spent
  FROM budgets b WHERE b.card = '' ORDER BY b.category, b.currency`

// StatusRow scans the 4-column budget-status query.
type StatusRow struct {
	Category   string  `bun:"category"`
	Currency   string  `bun:"currency"`
	CycleLimit float64 `bun:"cycle_limit"`
	Spent      float64 `bun:"spent"`
}

type cycleWindowRow struct {
	Start string `bun:"cstart"`
	End   string `bun:"cend"`
}

// CycleWindow returns [start, end) for a day-of-month cycle.
func (s *Service) CycleWindow(ctx context.Context, ref string, day int) (string, string, error) {
	var cr cycleWindowRow
	err := s.DB.NewRaw(CycleWindowSQL, ref, day, ref, day, ref, day).Scan(ctx, &cr)
	return cr.Start, cr.End, err
}

// CycleWindowDays returns [start, end) for a fixed-length cycle.
func (s *Service) CycleWindowDays(ctx context.Context, anchor string, length int, ref string) (string, string, error) {
	var cr cycleWindowRow
	err := s.DB.NewRaw(DaysCycleWindowSQL, anchor, ref, anchor, length, length, length).Scan(ctx, &cr)
	return cr.Start, cr.End, err
}

// cycleWindow picks the window strategy from the card's cycle config.
func (s *Service) cycleWindow(ctx context.Context, c *model.Card, ref string) (string, string, error) {
	if c.CycleType == "days" && c.CycleLengthDays != nil && *c.CycleLengthDays > 0 &&
		c.CycleAnchor != nil && *c.CycleAnchor != "" {
		return s.CycleWindowDays(ctx, *c.CycleAnchor, int(*c.CycleLengthDays), ref)
	}
	return s.CycleWindow(ctx, ref, clamp(int(c.CycleStartDay), 1, 28))
}

func (s *Service) ListBudgets(ctx context.Context) ([]model.Budget, error) {
	budgets := []model.Budget{}
	err := s.DB.NewSelect().Model(&budgets).
		Order("card").Order("category").Order("currency").Scan(ctx)
	return budgets, err
}

// BudgetInput is the upsert payload for a budget.
type BudgetInput struct {
	Card       string
	Category   string
	Currency   string
	CycleLimit float64
}

func (s *Service) PutBudget(ctx context.Context, in BudgetInput) error {
	currency := in.Currency
	if currency == "" {
		currency = "PEN"
	}
	if _, err := s.DB.NewInsert().Model(&model.Category{Name: in.Category}).Ignore().Exec(ctx); err != nil {
		return err
	}
	bud := &model.Budget{Card: in.Card, Category: in.Category, Currency: currency, CycleLimit: in.CycleLimit}
	_, err := s.DB.NewInsert().Model(bud).
		On("CONFLICT (card, category, currency) DO UPDATE").
		Set("cycle_limit = EXCLUDED.cycle_limit").
		Exec(ctx)
	return err
}

// BudgetStatus evaluates spend vs limit. With card != "" it uses that card's current
// billing cycle; otherwise legacy calendar-month mode. Returns the response-shaped map.
func (s *Service) BudgetStatus(ctx context.Context, card, month, ref string) (map[string]any, error) {
	if card == "" {
		if month == "" {
			if err := s.DB.NewRaw("SELECT strftime('%Y-%m','now')").Scan(ctx, &month); err != nil {
				return nil, err
			}
		}
		rows := []StatusRow{}
		if err := s.DB.NewRaw(budgetStatusMonthSQL, month).Scan(ctx, &rows); err != nil {
			return nil, err
		}
		return map[string]any{"month": month, "budgets": budgetJSON(rows)}, nil
	}

	var c model.Card
	err := s.DB.NewSelect().Model(&c).Where("bank = ?", card).Scan(ctx)
	if err == sql.ErrNoRows {
		return nil, ErrUnknownCard
	} else if err != nil {
		return nil, err
	}

	if ref == "" {
		ref = "now"
	}
	start, end, err := s.cycleWindow(ctx, &c, ref)
	if err != nil {
		return nil, err
	}
	rows := []StatusRow{}
	if err := s.DB.NewRaw(BudgetStatusCycleSQL, card, start, end, card).Scan(ctx, &rows); err != nil {
		return nil, err
	}
	return map[string]any{
		"card":        card,
		"cycle_start": start,
		"cycle_end":   end,
		"budgets":     budgetJSON(rows),
	}, nil
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
