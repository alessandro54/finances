package service

import (
	"context"
	"strings"

	"finances-api/internal/model"
)

func (s *Service) ListCategories(ctx context.Context) ([]string, error) {
	names := []string{}
	err := s.DB.NewSelect().Model((*model.Category)(nil)).
		Column("name").Order("name").Scan(ctx, &names)
	return names, err
}

func (s *Service) CreateCategory(ctx context.Context, name string) (int64, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return 0, ErrEmptyName
	}
	res, err := s.DB.NewInsert().Model(&model.Category{Name: name}).Ignore().Exec(ctx)
	if err != nil {
		return 0, err
	}
	n, _ := res.RowsAffected()
	return n, nil
}

// DeleteCategory removes a category; transactions using it are set to NULL so they
// fall under "Others" rather than dangling on a name that's no longer selectable.
func (s *Service) DeleteCategory(ctx context.Context, name string) (deleted, cleared int64, err error) {
	c, err := s.DB.NewUpdate().Model((*model.Transaction)(nil)).
		Set("category = NULL").Where("category = ?", name).Exec(ctx)
	if err != nil {
		return 0, 0, err
	}
	d, err := s.DB.NewDelete().Model((*model.Category)(nil)).
		Where("name = ?", name).Exec(ctx)
	if err != nil {
		return 0, 0, err
	}
	cleared, _ = c.RowsAffected()
	deleted, _ = d.RowsAffected()
	return deleted, cleared, nil
}
