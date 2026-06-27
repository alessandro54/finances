// Package model holds the Bun ORM models, one per table.
package model

import "github.com/uptrace/bun"

type Transaction struct {
	bun.BaseModel `bun:"table:transactions" json:"-"`

	DedupeID        string   `bun:"dedupe_id,pk" json:"dedupe_id"`
	Date            *string  `bun:"date" json:"date"`
	Time            *string  `bun:"time" json:"time"`
	Bank            *string  `bun:"bank" json:"bank"`
	CardLast4       *string  `bun:"card_last4" json:"card_last4"`
	Amount          *float64 `bun:"amount" json:"amount"`
	Currency        *string  `bun:"currency" json:"currency"`
	Merchant        *string  `bun:"merchant" json:"merchant"`
	MerchantClean   *string  `bun:"merchant_clean" json:"merchant_clean"`
	TransactionType *string  `bun:"transaction_type" json:"transaction_type"`
	Channel         *string  `bun:"channel" json:"channel"`
	Confidence      *string  `bun:"confidence" json:"confidence"`
	RawText         *string  `bun:"raw_text" json:"-"` // not exposed via API
	Source          *string  `bun:"source" json:"source"`
	Category        *string  `bun:"category" json:"category"`
	CreatedAt       *string  `bun:"created_at" json:"created_at"`
	DeletedAt       *string  `bun:"deleted_at" json:"-"` // soft delete; reads filter deleted_at IS NULL
}

type Category struct {
	bun.BaseModel `bun:"table:categories" json:"-"`

	Name      string  `bun:"name,pk" json:"name"`
	CreatedAt *string `bun:"created_at" json:"-"`
}

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

type Budget struct {
	bun.BaseModel `bun:"table:budgets" json:"-"`

	Card       string  `bun:"card,pk" json:"card"`
	Category   string  `bun:"category,pk" json:"category"`
	Currency   string  `bun:"currency,pk" json:"currency"`
	CycleLimit float64 `bun:"cycle_limit" json:"cycle_limit"`
	CreatedAt  *string `bun:"created_at" json:"-"`
}
