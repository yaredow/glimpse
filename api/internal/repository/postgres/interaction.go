package postgres

import (
	"context"

	"github.com/yaredow/glimpse-api/internal/domain"
)

type InteractionRepository struct {
	db *DB
}

func NewInteractionRepository(db *DB) *InteractionRepository {
	return &InteractionRepository{db: db}
}

func (ir *InteractionRepository) Insert(ctx context.Context, interaction *domain.Interaction) error {
	query := `INSERT INTO user_interactions (user_id, movie_id, action, grid_session_id, grid_position, reveal_to_action_ms) VALUES ($1, $2, $3, $4, $5, $6)`

	args := []any{
		interaction.UserID,
		interaction.MovieID,
		interaction.Action,
		interaction.GridSessionID,
		interaction.GridPosition,
		interaction.RevealToActionMS,
	}
	_, err := ir.db.Exec(ctx, query, args...)

	return err
}

func (ir *InteractionRepository) List(ctx context.Context, userID int64, limit int) ([]*domain.Interaction, error) {
	query := `SELECT id, user_id, movie_id, action, grid_session_id, grid_position, reveal_to_action_ms, acted_at FROM user_interactions WHERE user_id = $1 ORDER BY acted_at DESC LIMIT $2`

	rows, err := ir.db.Query(ctx, query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var interactions []*domain.Interaction
	for rows.Next() {
		var i domain.Interaction
		if err := rows.Scan(
			&i.ID, &i.UserID, &i.MovieID, &i.Action,
			&i.GridSessionID, &i.GridPosition, &i.RevealToActionMS, &i.ActedAt,
		); err != nil {
			return nil, err
		}
		interactions = append(interactions, &i)
	}

	return interactions, rows.Err()
}
