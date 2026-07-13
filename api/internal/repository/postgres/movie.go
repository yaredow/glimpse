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

func (mr *MovieRepository) WithTx(tx pgx.Tx) *MovieRepository {
	return &MovieRepository{db: &DB{Pool: txPool{tx}}}
}

func (mr *MovieRepository) GetByID(ctx context.Context, movieID int64) (*domain.Movie, error) {
	query := `SELECT id, tmdb_id, imdb_id, vague_description, genres, title, original_title, full_synopsis, poster_path, backdrop_path, tagline, director, cast_members, trailer_key, release_date, runtime, vote_average, vote_count, original_language, spoken_languages, production_countries, popularity, shown_count, watched_count, detail_synced_at, created_at FROM movies WHERE id = $1`

	var m domain.Movie
	err := mr.db.QueryRow(ctx, query, movieID).Scan(
		&m.ID, &m.TmdbID, &m.ImdbID, &m.VagueDescription, &m.Genres,
		&m.Title, &m.OriginalTitle, &m.FullSynopsis, &m.PosterPath,
		&m.BackdropPath, &m.Tagline, &m.Director, &m.CastMembers,
		&m.TrailerKey, &m.ReleaseDate, &m.Runtime, &m.VoteAverage,
		&m.VoteCount, &m.OriginalLanguage, &m.SpokenLanguages,
		&m.ProductionCountries, &m.Popularity, &m.ShownCount, &m.WatchedCount,
		&m.DetailSyncedAt, &m.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &m, nil
}

func (mr *MovieRepository) GetCandidateMovies(ctx context.Context, userID int64, limit int) ([]*domain.Movie, error) {
	query := `
		SELECT m.id, m.tmdb_id, m.imdb_id, m.vague_description, m.genres, m.title,
			m.original_title, m.full_synopsis, m.poster_path, m.backdrop_path,
			m.tagline, m.director, m.cast_members, m.trailer_key, m.release_date,
			m.runtime, m.vote_average, m.vote_count, m.original_language,
			m.spoken_languages, m.production_countries, m.popularity,
			m.shown_count, m.watched_count, m.detail_synced_at, m.created_at
		FROM movies m
		JOIN user_preferences up ON up.user_id = $1
		WHERE m.id NOT IN (
			SELECT movie_id FROM user_grid_history WHERE user_id = $1
		)
		AND m.original_language = ANY(up.languages)
		AND m.release_date >= make_date(up.min_year, 1, 1)
		AND m.release_date <= make_date(up.max_year, 12, 31)
		AND m.vote_average >= up.min_rating
		AND (CARDINALITY(up.excluded_genres) = 0 OR NOT m.genres && ARRAY(
			SELECT name FROM genres WHERE id = ANY(up.excluded_genres)
		))
		ORDER BY m.popularity DESC
		LIMIT $2`

	rows, err := mr.db.Query(ctx, query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var movies []*domain.Movie
	for rows.Next() {
		var m domain.Movie
		if err := rows.Scan(
			&m.ID, &m.TmdbID, &m.ImdbID, &m.VagueDescription, &m.Genres,
			&m.Title, &m.OriginalTitle, &m.FullSynopsis, &m.PosterPath,
			&m.BackdropPath, &m.Tagline, &m.Director, &m.CastMembers,
			&m.TrailerKey, &m.ReleaseDate, &m.Runtime, &m.VoteAverage,
			&m.VoteCount, &m.OriginalLanguage, &m.SpokenLanguages,
			&m.ProductionCountries, &m.Popularity, &m.ShownCount, &m.WatchedCount,
			&m.DetailSyncedAt, &m.CreatedAt,
		); err != nil {
			return nil, err
		}
		movies = append(movies, &m)
	}

	return movies, rows.Err()
}

func (mr *MovieRepository) UpdateMovieDetail(ctx context.Context, tmdbID int, d *domain.MovieDetailParams) error {
	query := `UPDATE movies SET
		imdb_id              = $2,
		tagline              = $3,
		director             = $4,
		cast_members         = $5,
		trailer_key          = $6,
		runtime              = $7,
		full_synopsis        = $8,
		poster_path          = $9,
		backdrop_path        = $10,
		spoken_languages     = $11,
		production_countries = $12,
		detail_synced_at     = NOW()
	WHERE tmdb_id = $1`

	_, err := mr.db.Exec(ctx, query,
		tmdbID, d.ImdbID, d.Tagline, d.Director, d.CastMembers,
		d.TrailerKey, d.Runtime, d.FullSynopsis, d.PosterPath,
		d.BackdropPath, d.SpokenLanguages, d.ProductionCountries,
	)
	return err
}

func (mr *MovieRepository) UpdateWatchCount(ctx context.Context, movieID int64, shown, watched bool) error {
	query := `UPDATE movies SET
		shown_count   = shown_count + CASE WHEN $2 THEN 1 ELSE 0 END,
		watched_count = watched_count + CASE WHEN $3 THEN 1 ELSE 0 END
	WHERE id = $1`
	_, err := mr.db.Exec(ctx, query, movieID, shown, watched)
	return err
}
