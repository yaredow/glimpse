package postgres

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/yaredow/glimpse-api/internal/domain"
)

type RecommendationRepository struct {
	db *DB
}

func NewRecommendationRepository(db *DB) *RecommendationRepository {
	return &RecommendationRepository{db: db}
}

func (rr *RecommendationRepository) UpsertBatchMovies(ctx context.Context, movies []*domain.Movie) error {
	if len(movies) == 0 {
		return nil
	}

	return rr.db.ExecTx(ctx, func(tx pgx.Tx) error {
		query := `
			INSERT INTO movies (tmdb_id, title, vague_description, genres, original_language, release_date, vote_average, popularity)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			ON CONFLICT (tmdb_id) DO UPDATE SET
				title             = EXCLUDED.title,
				vague_description = EXCLUDED.vague_description,
				genres            = EXCLUDED.genres,
				original_language = EXCLUDED.original_language,
				release_date      = EXCLUDED.release_date,
				vote_average      = EXCLUDED.vote_average,
				popularity        = EXCLUDED.popularity`

		for _, m := range movies {
			args := []any{
				m.TmdbID, m.Title, m.VagueDescription, m.Genres, m.OriginalLanguage, m.ReleaseDate, m.VoteAverage, m.Popularity,
			}

			if _, err := tx.Exec(ctx, query, args...); err != nil {
				return err
			}
		}

		return nil
	})
}

func (rr *RecommendationRepository) UpsertBatchGenres(ctx context.Context, genres []*domain.Genre) error {
	if len(genres) == 0 {
		return nil
	}

	return rr.db.ExecTx(ctx, func(tx pgx.Tx) error {
		query := `
			INSERT INTO genres (id, name)
			VALUES ($1, $2)
			ON CONFLICT (id) DO UPDATE SET
				name = EXCLUDED.name`

		for _, g := range genres {
			args := []any{
				g.ID,
				g.Name,
			}

			if _, err := tx.Exec(ctx, query, args...); err != nil {
				return err
			}
		}

		return nil
	})
}
