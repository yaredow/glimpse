package postgres_test

import (
	"context"
	"testing"
	"time"

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
