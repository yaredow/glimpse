package postgres

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/yaredow/glimpse-api/internal/domain"
)

type GridRepository struct {
	db *DB
}

func NewGridRepository(db *DB) *GridRepository {
	return &GridRepository{db: db}
}

func (gr *GridRepository) GetByID(ctx context.Context, userID int64) ([]domain.GridSlotResponse, error) {
	query := `
		SELECT
			m.id,
			m.tmdb_id,
			d.slot_number,
			d.is_revealed,
			m.vague_description,
			m.tagline,
			m.genres,
			m.title,
			m.poster_path,
			m.backdrop_path,
			m.vote_average,
			m.release_date,
			d.grid_session_id,
			(
				SELECT ui.action
				FROM user_interactions ui
				WHERE ui.user_id = d.user_id
				  AND ui.movie_id = d.movie_id
				  AND ui.grid_session_id = d.grid_session_id
				ORDER BY ui.acted_at DESC
				LIMIT 1
			) AS action,
			EXISTS (
				SELECT 1
				FROM user_interactions ui
				WHERE ui.user_id = d.user_id
				  AND ui.movie_id = d.movie_id
				  AND ui.grid_session_id = d.grid_session_id
				  AND ui.action = 'locked_in'
			) AS is_locked_in
		FROM daily_pools d
		JOIN movies m ON m.id = d.movie_id
		WHERE d.user_id = $1
		  AND d.pool_date = CURRENT_DATE
		ORDER BY d.slot_number`

	rows, err := gr.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var slots []domain.GridSlotResponse
	for rows.Next() {
		var s domain.GridSlotResponse
		if err := rows.Scan(
			&s.MovieID,
			&s.TmdbID,
			&s.SlotNumber,
			&s.IsRevealed,
			&s.VagueDescription,
			&s.Tagline,
			&s.Genres,
			&s.Title,
			&s.PosterPath,
			&s.BackdropPath,
			&s.VoteAverage,
			&s.ReleaseDate,
			&s.GridSessionID,
			&s.Action,
			&s.IsLockedIn,
		); err != nil {
			return nil, err
		}
		if s.Action != nil {
			s.IsRevealed = true
		}
		slots = append(slots, s)
	}

	return slots, rows.Err()
}

func (gr *GridRepository) MarkRevealed(ctx context.Context, userID, movieID int64) error {
	query := `UPDATE daily_pools SET is_revealed = TRUE WHERE user_id = $1 AND movie_id = $2 AND pool_date = CURRENT_DATE`
	_, err := gr.db.Exec(ctx, query, userID, movieID)
	return err
}

func (gr *GridRepository) Clear(ctx context.Context, userID int64) error {
	query := `DELETE FROM daily_pools WHERE user_id = $1`
	_, err := gr.db.Exec(ctx, query, userID)
	return err
}

func (gr *GridRepository) WithTx(tx pgx.Tx) *GridRepository {
	return &GridRepository{db: &DB{Pool: txPool{tx}}}
}

func (gr *GridRepository) Insert(ctx context.Context, userID int64, movieID int64, sessionID uuid.UUID, slotNumber int) error {
	query := `INSERT INTO daily_pools (user_id, movie_id, slot_number, grid_session_id) VALUES ($1, $2, $3, $4)`

	args := []any{userID, movieID, slotNumber, sessionID}
	_, err := gr.db.Exec(ctx, query, args...)

	return err
}

func (gr *GridRepository) IsLockedIn(ctx context.Context, userID int64) (bool, error) {
	query := `
		SELECT EXISTS (
			SELECT 1
			FROM daily_pools d
			JOIN user_interactions ui ON ui.user_id = d.user_id
			                         AND ui.movie_id = d.movie_id
			                         AND ui.grid_session_id = d.grid_session_id
			WHERE d.user_id = $1
			  AND d.pool_date = CURRENT_DATE
			  AND ui.action = 'locked_in'
		)
	`
	var locked bool
	err := gr.db.QueryRow(ctx, query, userID).Scan(&locked)
	return locked, err
}
