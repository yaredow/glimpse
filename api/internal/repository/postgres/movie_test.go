package postgres_test

import (
	"context"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/pashagolub/pgxmock/v5"
	"github.com/stretchr/testify/require"
	"github.com/yaredow/glimpse-api/internal/domain"
	"github.com/yaredow/glimpse-api/internal/repository/postgres"
)

func TestMovieRepository_ListAllGenres(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewMovieRepository(&postgres.DB{Pool: mock})

		mock.ExpectQuery("SELECT id, name FROM genres ORDER BY name").
			WillReturnRows(pgxmock.NewRows([]string{"id", "name"}).
				AddRow(28, "Action").
				AddRow(12, "Adventure").
				AddRow(35, "Comedy"))

		genres, err := repo.ListAllGenres(context.Background())
		require.NoError(t, err)
		require.Len(t, genres, 3)
		require.Equal(t, "Action", genres[0].Name)
		require.Equal(t, 28, genres[0].ID)
		require.Equal(t, "Comedy", genres[2].Name)
		require.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("empty", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewMovieRepository(&postgres.DB{Pool: mock})

		mock.ExpectQuery("SELECT id, name FROM genres ORDER BY name").
			WillReturnRows(pgxmock.NewRows([]string{"id", "name"}))

		genres, err := repo.ListAllGenres(context.Background())
		require.NoError(t, err)
		require.Len(t, genres, 0)
		require.NoError(t, mock.ExpectationsWereMet())
	})
}

func TestMovieRepository_UpsertBatchGenres(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewMovieRepository(&postgres.DB{Pool: mock})

		mock.ExpectBegin()
		mock.ExpectExec("INSERT INTO genres").
			WithArgs(28, "Action").
			WillReturnResult(pgxmock.NewResult("INSERT", 1))
		mock.ExpectExec("INSERT INTO genres").
			WithArgs(12, "Adventure").
			WillReturnResult(pgxmock.NewResult("INSERT", 1))
		mock.ExpectCommit()

		genres := []*domain.Genre{
			{ID: 28, Name: "Action"},
			{ID: 12, Name: "Adventure"},
		}

		err = repo.UpsertBatchGenres(context.Background(), genres)
		require.NoError(t, err)
		require.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("empty", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewMovieRepository(&postgres.DB{Pool: mock})

		err = repo.UpsertBatchGenres(context.Background(), nil)
		require.NoError(t, err)
		require.NoError(t, mock.ExpectationsWereMet())
	})
}

func TestMovieRepository_GetByID(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewMovieRepository(&postgres.DB{Pool: mock})

		now := time.Now()
		releaseDate := time.Date(2020, 1, 15, 0, 0, 0, 0, time.UTC)

		mock.ExpectQuery(`SELECT id, tmdb_id, imdb_id, vague_description, genres, title, original_title, full_synopsis, poster_path, backdrop_path, tagline, director, cast_members, trailer_key, release_date, runtime, vote_average, vote_count, original_language, spoken_languages, production_countries, popularity, shown_count, watched_count, detail_synced_at, created_at FROM movies WHERE id = \$1`).
			WithArgs(int64(1)).
			WillReturnRows(pgxmock.NewRows([]string{
				"id", "tmdb_id", "imdb_id", "vague_description", "genres", "title",
				"original_title", "full_synopsis", "poster_path", "backdrop_path",
				"tagline", "director", "cast_members", "trailer_key", "release_date",
				"runtime", "vote_average", "vote_count", "original_language",
				"spoken_languages", "production_countries", "popularity",
				"shown_count", "watched_count", "detail_synced_at", "created_at",
			}).AddRow(
				int64(1), 550, nil, "A mysterious journey", []string{"Drama", "Action"},
				"Fight Club", nil, nil, nil, nil, nil, nil, nil, nil,
				releaseDate, nil, 8.8, nil, "en", nil, nil,
				150.0, 0, 0, nil, now,
			))

		movie, err := repo.GetByID(context.Background(), 1)
		require.NoError(t, err)
		require.NotNil(t, movie)
		require.Equal(t, int64(1), movie.ID)
		require.Equal(t, 550, movie.TmdbID)
		require.Equal(t, "Fight Club", movie.Title)
		require.Equal(t, []string{"Drama", "Action"}, movie.Genres)
		require.Equal(t, 8.8, movie.VoteAverage)
		require.Equal(t, "en", movie.OriginalLanguage)
		require.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("not found", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewMovieRepository(&postgres.DB{Pool: mock})

		mock.ExpectQuery(`SELECT id, tmdb_id, imdb_id, vague_description, genres, title, original_title, full_synopsis, poster_path, backdrop_path, tagline, director, cast_members, trailer_key, release_date, runtime, vote_average, vote_count, original_language, spoken_languages, production_countries, popularity, shown_count, watched_count, detail_synced_at, created_at FROM movies WHERE id = \$1`).
			WithArgs(int64(999)).
			WillReturnError(pgx.ErrNoRows)

		movie, err := repo.GetByID(context.Background(), 999)
		require.Error(t, err)
		require.Nil(t, movie)
		require.NoError(t, mock.ExpectationsWereMet())
	})
}

func TestMovieRepository_UpdateWatchCount(t *testing.T) {
	t.Parallel()

	t.Run("shown only", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewMovieRepository(&postgres.DB{Pool: mock})

		mock.ExpectExec(`UPDATE movies SET shown_count = shown_count \+ CASE WHEN \$2 THEN 1 ELSE 0 END, watched_count = watched_count \+ CASE WHEN \$3 THEN 1 ELSE 0 END WHERE id = \$1`).
			WithArgs(int64(1), true, false).
			WillReturnResult(pgxmock.NewResult("UPDATE", 1))

		err = repo.UpdateWatchCount(context.Background(), 1, true, false)
		require.NoError(t, err)
		require.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("watched only", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewMovieRepository(&postgres.DB{Pool: mock})

		mock.ExpectExec(`UPDATE movies SET shown_count = shown_count \+ CASE WHEN \$2 THEN 1 ELSE 0 END, watched_count = watched_count \+ CASE WHEN \$3 THEN 1 ELSE 0 END WHERE id = \$1`).
			WithArgs(int64(1), true, true).
			WillReturnResult(pgxmock.NewResult("UPDATE", 1))

		err = repo.UpdateWatchCount(context.Background(), 1, true, true)
		require.NoError(t, err)
		require.NoError(t, mock.ExpectationsWereMet())
	})
}

func TestMovieRepository_GetCandidateMovies(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewMovieRepository(&postgres.DB{Pool: mock})

		releaseDate := time.Date(2020, 1, 15, 0, 0, 0, 0, time.UTC)
		now := time.Now()

		rows := pgxmock.NewRows([]string{
			"id", "tmdb_id", "imdb_id", "vague_description", "genres", "title",
			"original_title", "full_synopsis", "poster_path", "backdrop_path",
			"tagline", "director", "cast_members", "trailer_key", "release_date",
			"runtime", "vote_average", "vote_count", "original_language",
			"spoken_languages", "production_countries", "popularity",
			"shown_count", "watched_count", "detail_synced_at", "created_at",
		}).AddRow(
			int64(1), 550, nil, "A mysterious journey", []string{"Drama", "Action"},
			"Fight Club", nil, nil, nil, nil, nil, nil, nil, nil,
			releaseDate, nil, 8.8, nil, "en", nil, nil,
			150.0, 0, 0, nil, now,
		)

		mock.ExpectQuery(`SELECT\s+m\.id,\s+m\.tmdb_id,\s+m\.imdb_id,\s+m\.vague_description,\s+m\.genres,\s+m\.title,\s+m\.original_title,\s+m\.full_synopsis,\s+m\.poster_path,\s+m\.backdrop_path,\s+m\.tagline,\s+m\.director,\s+m\.cast_members,\s+m\.trailer_key,\s+m\.release_date,\s+m\.runtime,\s+m\.vote_average,\s+m\.vote_count,\s+m\.original_language,\s+m\.spoken_languages,\s+m\.production_countries,\s+m\.popularity,\s+m\.shown_count,\s+m\.watched_count,\s+m\.detail_synced_at,\s+m\.created_at\s+FROM\s+movies\s+m\s+JOIN\s+user_preferences\s+up\s+ON\s+up\.user_id\s+=\s+\$1\s+WHERE\s+m\.id\s+NOT\s+IN\s+\(\s*SELECT\s+movie_id\s+FROM\s+user_grid_history\s+WHERE\s+user_id\s+=\s+\$1\s*\).*ORDER\s+BY\s+m\.popularity\s+DESC\s+LIMIT\s+\$2`).
			WithArgs(int64(1), 200).
			WillReturnRows(rows)

		movies, err := repo.GetCandidateMovies(context.Background(), 1, 200)
		require.NoError(t, err)
		require.Len(t, movies, 1)
		require.Equal(t, "Fight Club", movies[0].Title)
		require.Equal(t, 8.8, movies[0].VoteAverage)
		require.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("no rows", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewMovieRepository(&postgres.DB{Pool: mock})

		mock.ExpectQuery(`SELECT\s+m\.id,\s+m\.tmdb_id,\s+m\.imdb_id,\s+m\.vague_description,\s+m\.genres,\s+m\.title,\s+m\.original_title,\s+m\.full_synopsis,\s+m\.poster_path,\s+m\.backdrop_path,\s+m\.tagline,\s+m\.director,\s+m\.cast_members,\s+m\.trailer_key,\s+m\.release_date,\s+m\.runtime,\s+m\.vote_average,\s+m\.vote_count,\s+m\.original_language,\s+m\.spoken_languages,\s+m\.production_countries,\s+m\.popularity,\s+m\.shown_count,\s+m\.watched_count,\s+m\.detail_synced_at,\s+m\.created_at\s+FROM\s+movies\s+m\s+JOIN\s+user_preferences\s+up\s+ON\s+up\.user_id\s+=\s+\$1\s+WHERE\s+m\.id\s+NOT\s+IN\s+\(\s*SELECT\s+movie_id\s+FROM\s+user_grid_history\s+WHERE\s+user_id\s+=\s+\$1\s*\).*ORDER\s+BY\s+m\.popularity\s+DESC\s+LIMIT\s+\$2`).
			WithArgs(int64(1), 200).
			WillReturnRows(pgxmock.NewRows([]string{
				"id", "tmdb_id", "imdb_id", "vague_description", "genres", "title",
				"original_title", "full_synopsis", "poster_path", "backdrop_path",
				"tagline", "director", "cast_members", "trailer_key", "release_date",
				"runtime", "vote_average", "vote_count", "original_language",
				"spoken_languages", "production_countries", "popularity",
				"shown_count", "watched_count", "detail_synced_at", "created_at",
			}))

		movies, err := repo.GetCandidateMovies(context.Background(), 1, 200)
		require.NoError(t, err)
		require.Empty(t, movies)
		require.NoError(t, mock.ExpectationsWereMet())
	})
}

func TestMovieRepository_UpsertBatchMovies(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewMovieRepository(&postgres.DB{Pool: mock})

		mock.ExpectBegin()
		mock.ExpectExec("INSERT INTO movies").
			WithArgs(123, "Test Movie", "A test movie description.", []string{"Action", "Comedy"}, "en", time.Time{}, 7.5, 100.0).
			WillReturnResult(pgxmock.NewResult("INSERT", 1))
		mock.ExpectCommit()

		movies := []*domain.Movie{
			{
				TmdbID:           123,
				Title:            "Test Movie",
				VagueDescription: "A test movie description.",
				Genres:           []string{"Action", "Comedy"},
				OriginalLanguage: "en",
				ReleaseDate:      time.Time{},
				VoteAverage:      7.5,
				Popularity:       100.0,
			},
		}

		err = repo.UpsertBatchMovies(context.Background(), movies)
		require.NoError(t, err)
		require.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("empty", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewMovieRepository(&postgres.DB{Pool: mock})

		err = repo.UpsertBatchMovies(context.Background(), nil)
		require.NoError(t, err)
		require.NoError(t, mock.ExpectationsWereMet())
	})
}
