package service

import (
	"context"

	"github.com/yaredow/glimpse-api/internal/domain"
)

//go:generate mockery --name PreferenceRepository --dir . --output mocks --outpkg mocks
type PreferenceRepository interface {
	GetByUserID(ctx context.Context, userID int64) (*domain.Preference, error)
	Upsert(ctx context.Context, p *domain.Preference) error
}

type PreferenceService struct {
	repo PreferenceRepository
}

func NewPreferenceService(pr PreferenceRepository) *PreferenceService {
	return &PreferenceService{repo: pr}
}

func (ps *PreferenceService) GetByUserID(ctx context.Context, userID int64) (*domain.Preference, error) {
	return ps.repo.GetByUserID(ctx, userID)
}

func (ps *PreferenceService) Upsert(ctx context.Context, p *domain.Preference) error {
	if len(p.Languages) == 0 {
		p.Languages = []string{"en"}
	}

	if p.MinYear > p.MaxYear {
		return domain.ErrBadParamInput
	}

	return ps.repo.Upsert(ctx, p)
}
