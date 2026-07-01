package service

import (
	"context"
	"strings"

	"finances-api/internal/model"
)

// TxFilter narrows the transaction list. Empty string fields are ignored.
type TxFilter struct {
	Month, Category, Bank string
	Limit, Offset         int
}

func (s *Service) ListTransactions(ctx context.Context, f TxFilter) ([]model.Transaction, error) {
	txs := []model.Transaction{}
	err := s.DB.NewSelect().Model(&txs).
		Where("deleted_at IS NULL").
		Where("(? = '' OR strftime('%Y-%m', date) = ?)", f.Month, f.Month).
		Where("(? = '' OR category = ?)", f.Category, f.Category).
		Where("(? = '' OR bank = ?)", f.Bank, f.Bank).
		Order("date DESC").
		Order("time DESC").
		Limit(f.Limit).
		Offset(f.Offset).
		Scan(ctx)
	return txs, err
}

// PatchTx: nil fields are left unchanged. Blank Category clears to NULL (→ Others);
// Reviewed=true bumps confidence to 'high'.
type PatchTx struct {
	Category *string
	Reviewed *bool
}

func (s *Service) PatchTransaction(ctx context.Context, id string, p PatchTx) (int64, error) {
	var updated int64

	if p.Category != nil {
		category := strings.TrimSpace(*p.Category)
		upd := s.DB.NewUpdate().Model((*model.Transaction)(nil)).Where("dedupe_id = ?", id)
		if category == "" {
			upd = upd.Set("category = NULL")
		} else {
			if _, err := s.DB.NewInsert().Model(&model.Category{Name: category}).Ignore().Exec(ctx); err != nil {
				return updated, err
			}
			upd = upd.Set("category = ?", category)
		}
		res, err := upd.Exec(ctx)
		if err != nil {
			return updated, err
		}
		n, _ := res.RowsAffected()
		updated += n
	}

	if p.Reviewed != nil && *p.Reviewed {
		res, err := s.DB.NewUpdate().Model((*model.Transaction)(nil)).
			Set("confidence = 'high'").Where("dedupe_id = ?", id).Exec(ctx)
		if err != nil {
			return updated, err
		}
		n, _ := res.RowsAffected()
		updated += n
	}

	return updated, nil
}
