package postgres

import (
	"context"

	"github.com/google/uuid"
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
			m.genres,
			d.grid_session_id
		FROM daily_pools d
		JOIN movies m ON m.id = d.movie_id
		WHERE d.user_id = $1
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
			&s.Genres,
			&s.GridSessionID,
		); err != nil {
			return nil, err
		}
		slots = append(slots, s)
	}

	return slots, rows.Err()
}

func (gr *GridRepository) Clear(ctx context.Context, userID int64) error {
	query := `DELETE FROM daily_pools WHERE user_id = $1`
	_, err := gr.db.Exec(ctx, query, userID)
	return err
}

func (gr *GridRepository) Insert(ctx context.Context, userID int64, movieID int64, sessionID uuid.UUID, slotNumber int) error {
	query := `INSERT INTO daily_pools (user_id, movie_id, slot_number, grid_session_id) VALUES ($1, $2, $3, $4)`

	args := []any{userID, movieID, slotNumber, sessionID}
	_, err := gr.db.Exec(ctx, query, args...)

	return err
}
