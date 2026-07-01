// Package model holds the Bun ORM models, one file per table.
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
