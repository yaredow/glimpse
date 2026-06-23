package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/yaredow/glimpse-api/internal/entity"
	"github.com/yaredow/glimpse-api/internal/store/queries"
	recusecase "github.com/yaredow/glimpse-api/internal/usecase/recommendation"
)

type PreferenceRepo struct {
	db *DB
}

func NewPreferenceRepo(db *DB) *PreferenceRepo {
	return &PreferenceRepo{db: db}
}

func (pr *PreferenceRepo) GetByUser(ctx context.Context, userID int64) (*entity.Preference, error) {
	row, err := pr.db.q.GetUserPreference(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, recusecase.ErrRecordNotFound
		}
		return nil, fmt.Errorf("get preference: %w", err)
	}
	return mapPreference(row), nil
}

func (pr *PreferenceRepo) Upsert(ctx context.Context, userID int64, input recusecase.UpsertPreferenceInput, onboarded bool) (*entity.Preference, error) {
	row, err := pr.db.q.UpsertPreference(ctx, queries.UpsertPreferenceParams{
		UserID:         userID,
		FavoriteGenres: input.FavoriteGenres,
		ExcludedGenres: input.ExcludedGenres,
		Languages:      input.Languages,
		MinRating:      input.MinRating,
		Onboarded:      onboarded,
		MinYear:        input.MinYear,
		MaxYear:        input.MaxYear,
	})
	if err != nil {
		return nil, fmt.Errorf("upsert preference: %w", err)
	}
	return mapPreference(row), nil
}

func (pr *PreferenceRepo) Update(ctx context.Context, userID int64, input recusecase.UpsertPreferenceInput) (*entity.Preference, error) {
	current, err := pr.db.q.GetUserPreference(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, recusecase.ErrRecordNotFound
		}
		return nil, fmt.Errorf("get current preference: %w", err)
	}

	row, err := pr.db.q.UpsertPreference(ctx, queries.UpsertPreferenceParams{
		UserID:         userID,
		FavoriteGenres: input.FavoriteGenres,
		ExcludedGenres: input.ExcludedGenres,
		Languages:      input.Languages,
		MinRating:      input.MinRating,
		Onboarded:      current.Onboarded,
		MinYear:        input.MinYear,
		MaxYear:        input.MaxYear,
	})
	if err != nil {
		return nil, fmt.Errorf("update preference: %w", err)
	}
	return mapPreference(row), nil
}

func mapPreference(p queries.UserPreference) *entity.Preference {
	return &entity.Preference{
		UserID:         p.UserID,
		FavoriteGenres: p.FavoriteGenres,
		ExcludedGenres: p.ExcludedGenres,
		Languages:      p.Languages,
		MinRating:      p.MinRating,
		Onboarded:      p.Onboarded,
		CreatedAt:      p.CreatedAt,
		UpdatedAt:      p.UpdatedAt,
		MinYear:        p.MinYear,
		MaxYear:        p.MaxYear,
	}
}
