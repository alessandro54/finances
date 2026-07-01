package service

import (
	"context"
	"strings"

	"finances-api/internal/model"
)

func (s *Service) ListCards(ctx context.Context) ([]model.Card, error) {
	cards := []model.Card{}
	err := s.DB.NewSelect().Model(&cards).Order("bank").Scan(ctx)
	return cards, err
}

// CardInput is the upsert payload (pointers = optional/normalized below).
type CardInput struct {
	Bank            string
	Name            *string
	CardLast4       *string
	CycleStartDay   *int64
	CycleType       *string
	CycleLengthDays *int64
	CycleAnchor     *string
}

// UpsertCard normalizes and upserts a card keyed by bank.
func (s *Service) UpsertCard(ctx context.Context, in CardInput) error {
	bank := strings.TrimSpace(in.Bank)
	if bank == "" {
		return ErrEmptyName
	}
	day := int64(1)
	if in.CycleStartDay != nil {
		day = *in.CycleStartDay
	}
	day = int64(clamp(int(day), 1, 28))

	cycleType := "monthly"
	if in.CycleType != nil && *in.CycleType == "days" {
		cycleType = "days"
	}

	card := &model.Card{
		Bank:            bank,
		Name:            in.Name,
		CardLast4:       in.CardLast4,
		CycleStartDay:   day,
		CycleType:       cycleType,
		CycleLengthDays: in.CycleLengthDays,
		CycleAnchor:     in.CycleAnchor,
	}
	_, err := s.DB.NewInsert().Model(card).
		On("CONFLICT (bank) DO UPDATE").
		Set("name = EXCLUDED.name").
		Set("card_last4 = EXCLUDED.card_last4").
		Set("cycle_start_day = EXCLUDED.cycle_start_day").
		Set("cycle_type = EXCLUDED.cycle_type").
		Set("cycle_length_days = EXCLUDED.cycle_length_days").
		Set("cycle_anchor = EXCLUDED.cycle_anchor").
		Exec(ctx)
	return err
}

// DeleteCard removes a card and any budgets scoped to it.
func (s *Service) DeleteCard(ctx context.Context, bank string) (int64, error) {
	if _, err := s.DB.NewDelete().Model((*model.Budget)(nil)).Where("card = ?", bank).Exec(ctx); err != nil {
		return 0, err
	}
	res, err := s.DB.NewDelete().Model((*model.Card)(nil)).Where("bank = ?", bank).Exec(ctx)
	if err != nil {
		return 0, err
	}
	n, _ := res.RowsAffected()
	return n, nil
}
