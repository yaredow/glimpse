package postgres

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/yaredow/glimpse-api/internal/domain"
)

type PreferenceRepository struct {
	db *DB
}

func NewPreferenceRepository(db *DB) *PreferenceRepository {
	return &PreferenceRepository{db: db}
}

func (pr *PreferenceRepository) GetByUserID(ctx context.Context, userID int64) (*domain.Preference, error) {
	query := `
		SELECT user_id, favorite_genres, excluded_genres, languages, min_rating, min_year, max_year, created_at, updated_at
		FROM user_preferences
		WHERE user_id = $1`

	var p domain.Preference
	var favGenres, exclGenres []int32

	err := pr.db.QueryRow(ctx, query, userID).Scan(
		&p.UserID, &favGenres, &exclGenres, &p.Languages, &p.MinRating, &p.MinYear, &p.MaxYear, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	p.FavoriteGenres = make([]int, len(favGenres))
	for i, g := range favGenres {
		p.FavoriteGenres[i] = int(g)
	}
	p.ExcludedGenres = make([]int, len(exclGenres))
	for i, g := range exclGenres {
		p.ExcludedGenres[i] = int(g)
	}

	return &p, nil
}

func (pr *PreferenceRepository) Upsert(ctx context.Context, p *domain.Preference) error {
	favGenres := make([]int32, len(p.FavoriteGenres))
	for i, g := range p.FavoriteGenres {
		favGenres[i] = int32(g)
	}
	exclGenres := make([]int32, len(p.ExcludedGenres))
	for i, g := range p.ExcludedGenres {
		exclGenres[i] = int32(g)
	}

	query := `
		INSERT INTO user_preferences (user_id, favorite_genres, excluded_genres, languages, min_rating, min_year, max_year)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (user_id) DO UPDATE SET
			favorite_genres = EXCLUDED.favorite_genres,
			excluded_genres = EXCLUDED.excluded_genres,
			languages       = EXCLUDED.languages,
			min_rating      = EXCLUDED.min_rating,
			min_year        = EXCLUDED.min_year,
			max_year        = EXCLUDED.max_year,
			updated_at      = NOW()`

	_, err := pr.db.Exec(ctx, query, p.UserID, favGenres, exclGenres, p.Languages, p.MinRating, p.MinYear, p.MaxYear)
	return err
}
