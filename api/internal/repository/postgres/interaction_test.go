package postgres_test

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/pashagolub/pgxmock/v5"
	"github.com/stretchr/testify/require"
	"github.com/yaredow/glimpse-api/internal/domain"
	"github.com/yaredow/glimpse-api/internal/repository/postgres"
)

func TestInteractionRepository_List(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewInteractionRepository(&postgres.DB{Pool: mock})

		sessionID := uuid.New()
		now := time.Now()
		gridPos := 2
		revealMs := 1500

		rows := pgxmock.NewRows([]string{"id", "user_id", "movie_id", "action", "grid_session_id", "grid_position", "reveal_to_action_ms", "acted_at"}).
			AddRow(int64(1), int64(1), int64(10), domain.ActionRevealed, sessionID, &gridPos, &revealMs, now).
			AddRow(int64(2), int64(1), int64(20), domain.ActionSkipped, sessionID, nil, nil, now.Add(-time.Hour))

		mock.ExpectQuery(`SELECT id, user_id, movie_id, action, grid_session_id, grid_position, reveal_to_action_ms, acted_at FROM user_interactions WHERE user_id = \$1 ORDER BY acted_at DESC LIMIT \$2`).
			WithArgs(int64(1), 50).
			WillReturnRows(rows)

		interactions, err := repo.List(context.Background(), 1, 50)
		require.NoError(t, err)
		require.Len(t, interactions, 2)
		require.Equal(t, int64(1), interactions[0].ID)
		require.Equal(t, int64(10), interactions[0].MovieID)
		require.Equal(t, domain.ActionRevealed, interactions[0].Action)
		require.Equal(t, &gridPos, interactions[0].GridPosition)
		require.Equal(t, &revealMs, interactions[0].RevealToActionMS)
		require.Equal(t, int64(2), interactions[1].ID)
		require.Equal(t, domain.ActionSkipped, interactions[1].Action)
		require.Nil(t, interactions[1].GridPosition)
		require.Nil(t, interactions[1].RevealToActionMS)
		require.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("no rows", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewInteractionRepository(&postgres.DB{Pool: mock})

		mock.ExpectQuery(`SELECT id, user_id, movie_id, action, grid_session_id, grid_position, reveal_to_action_ms, acted_at FROM user_interactions WHERE user_id = \$1 ORDER BY acted_at DESC LIMIT \$2`).
			WithArgs(int64(1), 50).
			WillReturnRows(pgxmock.NewRows([]string{"id", "user_id", "movie_id", "action", "grid_session_id", "grid_position", "reveal_to_action_ms", "acted_at"}))

		interactions, err := repo.List(context.Background(), 1, 50)
		require.NoError(t, err)
		require.Empty(t, interactions)
		require.NoError(t, mock.ExpectationsWereMet())
	})
}

func TestInteractionRepository_Insert(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewInteractionRepository(&postgres.DB{Pool: mock})

		sessionID := uuid.New()
		gridPos := 2
		revealMs := 1500

		mock.ExpectExec(`INSERT INTO user_interactions \(user_id, movie_id, action, grid_session_id, grid_position, reveal_to_action_ms\) VALUES \(\$1, \$2, \$3, \$4, \$5, \$6\)`).
			WithArgs(int64(1), int64(10), domain.ActionRevealed, sessionID, &gridPos, &revealMs).
			WillReturnResult(pgxmock.NewResult("INSERT", 1))

		interaction := &domain.Interaction{
			UserID:           1,
			MovieID:          10,
			Action:           domain.ActionRevealed,
			GridSessionID:    sessionID,
			GridPosition:     &gridPos,
			RevealToActionMS: &revealMs,
		}

		err = repo.Insert(context.Background(), interaction)
		require.NoError(t, err)
		require.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("minimal fields", func(t *testing.T) {
		mock, err := pgxmock.NewPool()
		require.NoError(t, err)
		defer mock.Close()

		repo := postgres.NewInteractionRepository(&postgres.DB{Pool: mock})

		sessionID := uuid.New()

		mock.ExpectExec(`INSERT INTO user_interactions \(user_id, movie_id, action, grid_session_id, grid_position, reveal_to_action_ms\) VALUES \(\$1, \$2, \$3, \$4, \$5, \$6\)`).
			WithArgs(int64(1), int64(10), domain.ActionWatched, sessionID, pgxmock.AnyArg(), pgxmock.AnyArg()).
			WillReturnResult(pgxmock.NewResult("INSERT", 1))

		interaction := &domain.Interaction{
			UserID:        1,
			MovieID:       10,
			Action:        domain.ActionWatched,
			GridSessionID: sessionID,
		}

		err = repo.Insert(context.Background(), interaction)
		require.NoError(t, err)
		require.NoError(t, mock.ExpectationsWereMet())
	})
}

func TestInteractionRepository_GetHistory(t *testing.T) {
	t.Parallel()

	mock, err := pgxmock.NewPool()
	require.NoError(t, err)
	defer mock.Close()

	repo := postgres.NewInteractionRepository(&postgres.DB{Pool: mock})

	now := time.Now()
	poster := "/poster.jpg"
	backdrop := "/backdrop.jpg"
	tagline := "Your mind is the scene of the crime."
	synopsis := "A thief who steals corporate secrets..."
	director := "Christopher Nolan"
	runtime := 148
	cast := []byte(`[{"name":"Leonardo DiCaprio"}]`)
	trailer := "YoHD9XEInc0"

	rows := pgxmock.NewRows([]string{
		"movie_id", "action", "acted_at",
		"title", "poster_path", "backdrop_path", "genres",
		"release_date", "vote_average", "runtime",
		"vague_description", "full_synopsis", "tagline",
		"director", "cast_members", "trailer_key",
	}).AddRow(
		int64(42), "watched", now,
		"Inception", &poster, &backdrop, []string{"Action", "Sci-Fi"},
		now, 8.8, &runtime,
		"Dream theft thriller", &synopsis, &tagline,
		&director, cast, &trailer,
	)

	mock.ExpectQuery(`WITH ranked_history AS`).
		WithArgs(int64(1), "watched").
		WillReturnRows(rows)

	history, err := repo.GetHistory(context.Background(), 1, "watched")
	require.NoError(t, err)
	require.Len(t, history, 1)
	require.Equal(t, int64(42), history[0].MovieID)
	require.Equal(t, "Inception", history[0].Title)
	require.Equal(t, "watched", history[0].Action)
	require.NoError(t, mock.ExpectationsWereMet())
}
