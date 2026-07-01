package model

import "github.com/uptrace/bun"

type Card struct {
	bun.BaseModel `bun:"table:cards" json:"-"`

	Bank          string  `bun:"bank,pk" json:"bank"`
	Name          *string `bun:"name" json:"name"`
	CardLast4     *string `bun:"card_last4" json:"card_last4"`
	CycleStartDay int64   `bun:"cycle_start_day" json:"cycle_start_day"`
	// "monthly" = closes on CycleStartDay each month; "days" = every
	// CycleLengthDays from CycleAnchor (a known close date, YYYY-MM-DD).
	CycleType       string  `bun:"cycle_type" json:"cycle_type"`
	CycleLengthDays *int64  `bun:"cycle_length_days" json:"cycle_length_days"`
	CycleAnchor     *string `bun:"cycle_anchor" json:"cycle_anchor"`
	CreatedAt       *string `bun:"created_at" json:"-"`
}
