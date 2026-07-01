// Package service holds the business logic: DB queries, cycle math, dedup, and
// stats aggregation. Handlers stay thin (decode → call service → write); all the
// complexity lives here.
package service

import (
	"errors"

	"github.com/uptrace/bun"
)

type Service struct {
	DB *bun.DB
}

func New(db *bun.DB) *Service { return &Service{DB: db} }

// Validation/lookup errors the handler maps to 4xx.
var (
	ErrEmptyName   = errors.New("name is empty")
	ErrUnknownCard = errors.New("unknown card")
)

func clamp(n, lo, hi int) int {
	if n < lo {
		return lo
	}
	if n > hi {
		return hi
	}
	return n
}
