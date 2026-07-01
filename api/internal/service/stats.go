package service

import "context"

type CurrencyTotal struct {
	Currency *string `bun:"currency" json:"currency"`
	Total    float64 `bun:"total" json:"total"`
	Count    int64   `bun:"count" json:"count"`
}

type CategoryTotal struct {
	Category *string `bun:"category" json:"category"`
	Currency *string `bun:"currency" json:"currency"`
	Total    float64 `bun:"total" json:"total"`
	Count    int64   `bun:"count" json:"count"`
}

type BankTotal struct {
	Bank     *string `bun:"bank" json:"bank"`
	Currency *string `bun:"currency" json:"currency"`
	Total    float64 `bun:"total" json:"total"`
}

type DayTotal struct {
	Date     *string `bun:"date" json:"date"`
	Currency *string `bun:"currency" json:"currency"`
	Total    float64 `bun:"total" json:"total"`
}

type Stats struct {
	Month      *string         `json:"month"`
	ByCurrency []CurrencyTotal `json:"by_currency"`
	ByCategory []CategoryTotal `json:"by_category"`
	ByBank     []BankTotal     `json:"by_bank"`
	ByDay      []DayTotal      `json:"by_day"`
}

// Stats aggregates spend for a month (empty month = all-time). Soft-deleted rows excluded.
func (s *Service) Stats(ctx context.Context, month string) (*Stats, error) {
	out := &Stats{
		ByCurrency: []CurrencyTotal{},
		ByCategory: []CategoryTotal{},
		ByBank:     []BankTotal{},
		ByDay:      []DayTotal{},
	}

	if err := s.DB.NewRaw(
		`SELECT currency, COALESCE(SUM(amount),0.0) AS total, COUNT(*) AS count FROM transactions
		 WHERE deleted_at IS NULL AND (? = '' OR strftime('%Y-%m', date) = ?) GROUP BY currency`, month, month,
	).Scan(ctx, &out.ByCurrency); err != nil {
		return nil, err
	}
	if err := s.DB.NewRaw(
		`SELECT category, currency, COALESCE(SUM(amount),0.0) AS total, COUNT(*) AS count FROM transactions
		 WHERE deleted_at IS NULL AND (? = '' OR strftime('%Y-%m', date) = ?) GROUP BY category, currency ORDER BY total DESC`, month, month,
	).Scan(ctx, &out.ByCategory); err != nil {
		return nil, err
	}
	if err := s.DB.NewRaw(
		`SELECT bank, currency, COALESCE(SUM(amount),0.0) AS total FROM transactions
		 WHERE deleted_at IS NULL AND (? = '' OR strftime('%Y-%m', date) = ?) GROUP BY bank, currency`, month, month,
	).Scan(ctx, &out.ByBank); err != nil {
		return nil, err
	}
	if err := s.DB.NewRaw(
		`SELECT date, currency, COALESCE(SUM(amount),0.0) AS total FROM transactions
		 WHERE deleted_at IS NULL AND (? = '' OR strftime('%Y-%m', date) = ?) GROUP BY date, currency ORDER BY date`, month, month,
	).Scan(ctx, &out.ByDay); err != nil {
		return nil, err
	}

	if month != "" {
		out.Month = &month
	}
	return out, nil
}
