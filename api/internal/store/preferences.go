package store

import (
	"context"
	"errors"
	"fmt"
	"strconv"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/yaredow/glimpse-api/internal/store/queries"
	"github.com/yaredow/glimpse-api/internal/validator"
)

type UpsertPreferenceInput struct {
	FavoriteGenres []int32
	ExcludedGenres []int32
	Languages      []string
	MinRating      float64
	MinYear        int32
	MaxYear        int32
}

func ValidatePreferenceInput(v *validator.Validator, input UpsertPreferenceInput) {
	v.Check(len(input.Languages) > 0, "languages", "must provide at least one language")
	v.Check(input.MinRating >= 0 && input.MinRating <= 10, "min_rating", "must be between 0 and 10")
	v.Check(input.MinYear >= 1888, "min_year", "must be greater than 1888")
	v.Check(input.MaxYear >= input.MinYear, "max_year", "must be greater than min_year")
}

func (s *Store) UpsertPreference(ctx context.Context, userID int64, input UpsertPreferenceInput, onboarded bool) (queries.UserPreference, error) {
	var minRating pgtype.Numeric
	if err := minRating.Scan(strconv.FormatFloat(input.MinRating, 'f', 1, 64)); err != nil {
		return queries.UserPreference{}, fmt.Errorf("parse min_rating: %w", err)
	}

	prefs, err := s.Queries.UpsertPreference(ctx, queries.UpsertPreferenceParams{
		UserID:         userID,
		FavoriteGenres: input.FavoriteGenres,
		ExcludedGenres: input.ExcludedGenres,
		Languages:      input.Languages,
		MinRating:      minRating,
		Onboarded:      onboarded,
		MinYear:        input.MinYear,
		MaxYear:        input.MaxYear,
	})
	if err != nil {
		return queries.UserPreference{}, fmt.Errorf("upsert preference: %w", err)
	}

	return prefs, nil
}

func (s *Store) UpdatePreferences(ctx context.Context, userID int64, input UpsertPreferenceInput) (queries.UserPreference, error) {
	current, err := s.Queries.GetUserPreference(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return queries.UserPreference{}, ErrRecordNotFound
		}
		return queries.UserPreference{}, fmt.Errorf("get current preference: %w", err)
	}

	return s.UpsertPreference(ctx, userID, input, current.Onboarded)
}

func (s *Store) GetUserPreference(ctx context.Context, userID int64) (queries.UserPreference, error) {
	prefs, err := s.Queries.GetUserPreference(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return queries.UserPreference{}, ErrRecordNotFound
		}
		return queries.UserPreference{}, fmt.Errorf("get preference: %w", err)
	}

	return prefs, nil
}
