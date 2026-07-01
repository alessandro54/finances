package model

import "github.com/uptrace/bun"

type Budget struct {
	bun.BaseModel `bun:"table:budgets" json:"-"`

	Card       string  `bun:"card,pk" json:"card"`
	Category   string  `bun:"category,pk" json:"category"`
	Currency   string  `bun:"currency,pk" json:"currency"`
	CycleLimit float64 `bun:"cycle_limit" json:"cycle_limit"`
	CreatedAt  *string `bun:"created_at" json:"-"`
}
