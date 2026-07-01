package postgres

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/yaredow/glimpse-api/internal/domain"
)

type MovieRepository struct {
	db *DB
}

func NewMovieRepository(db *DB) *MovieRepository {
	return &MovieRepository{db: db}
}

func (mr *MovieRepository) UpsertBatchMovies(ctx context.Context, movies []*domain.Movie) error {
	if len(movies) == 0 {
		return nil
	}

	return mr.db.ExecTx(ctx, func(tx pgx.Tx) error {
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

func (mr *MovieRepository) UpsertBatchGenres(ctx context.Context, genres []*domain.Genre) error {
	if len(genres) == 0 {
		return nil
	}

	return mr.db.ExecTx(ctx, func(tx pgx.Tx) error {
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

func (mr *MovieRepository) ListAllGenres(ctx context.Context) ([]domain.Genre, error) {
	query := `SELECT id, name FROM genres ORDER BY name`

	rows, err := mr.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var genres []domain.Genre
	for rows.Next() {
		var g domain.Genre
		if err := rows.Scan(&g.ID, &g.Name); err != nil {
			return nil, err
		}
		genres = append(genres, g)
	}

	return genres, rows.Err()
}
