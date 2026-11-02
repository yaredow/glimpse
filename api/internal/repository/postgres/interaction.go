package postgres

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/yaredow/glimpse-api/internal/domain"
)

type InteractionRepository struct {
	db *DB
}

func NewInteractionRepository(db *DB) *InteractionRepository {
	return &InteractionRepository{db: db}
}

func (ir *InteractionRepository) WithTx(tx pgx.Tx) *InteractionRepository {
	return &InteractionRepository{db: &DB{Pool: txPool{tx}}}
}

func (ir *InteractionRepository) Insert(ctx context.Context, interaction *domain.Interaction) error {
	query := `INSERT INTO user_interactions (user_id, movie_id, action, grid_session_id, grid_position, reveal_to_action_ms, rating) VALUES ($1, $2, $3, $4, $5, $6, $7)`

	args := []any{
		interaction.UserID,
		interaction.MovieID,
		interaction.Action,
		interaction.GridSessionID,
		interaction.GridPosition,
		interaction.RevealToActionMS,
		interaction.Rating,
	}
	_, err := ir.db.Exec(ctx, query, args...)

	return err
}

func (ir *InteractionRepository) HasWatched(ctx context.Context, userID, movieID int64) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM user_interactions WHERE user_id = $1 AND movie_id = $2 AND action = 'watched')`
	var exists bool
	err := ir.db.QueryRow(ctx, query, userID, movieID).Scan(&exists)
	return exists, err
}

func (ir *InteractionRepository) List(ctx context.Context, userID int64, limit int) ([]*domain.Interaction, error) {
	query := `SELECT id, user_id, movie_id, action, grid_session_id, grid_position, reveal_to_action_ms, rating, acted_at FROM user_interactions WHERE user_id = $1 ORDER BY acted_at DESC LIMIT $2`

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
			&i.GridSessionID, &i.GridPosition, &i.RevealToActionMS,
			&i.Rating, &i.ActedAt,
		); err != nil {
			return nil, err
		}
		interactions = append(interactions, &i)
	}

	return interactions, rows.Err()
}

func (ir *InteractionRepository) GetHistory(ctx context.Context, userID int64, action string) ([]domain.HistoryMovie, error) {
	query := `
		WITH ranked_history AS (
			SELECT 
				ui.movie_id, ui.action::text, ui.acted_at, ui.rating,
				m.title, m.poster_path, m.backdrop_path, m.genres,
				m.release_date, m.vote_average, m.runtime,
				m.vague_description, m.full_synopsis, m.tagline,
				m.director, m.cast_members, m.trailer_key,
				ROW_NUMBER() OVER (PARTITION BY ui.movie_id, ui.action ORDER BY ui.acted_at DESC) as rn
			FROM user_interactions ui
			JOIN movies m ON m.id = ui.movie_id
			WHERE ui.user_id = $1
			  AND ($2 = '' OR ui.action::text = $2)
			  AND ui.action IN ('watched', 'watchlist_add')
		)
		SELECT 
			movie_id, action, acted_at, rating,
			title, poster_path, backdrop_path, genres,
			release_date, vote_average, runtime,
			vague_description, full_synopsis, tagline,
			director, cast_members, trailer_key
		FROM ranked_history
		WHERE rn = 1
		ORDER BY acted_at DESC`

	rows, err := ir.db.Query(ctx, query, userID, action)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var history []domain.HistoryMovie
	for rows.Next() {
		var h domain.HistoryMovie
		if err := rows.Scan(
			&h.MovieID, &h.Action, &h.ActedAt, &h.Rating,
			&h.Title, &h.PosterPath, &h.BackdropPath, &h.Genres,
			&h.ReleaseDate, &h.VoteAverage, &h.Runtime,
			&h.VagueDescription, &h.FullSynopsis, &h.Tagline,
			&h.Director, &h.CastMembers, &h.TrailerKey,
		); err != nil {
			return nil, err
		}
		history = append(history, h)
	}

	return history, rows.Err()
}
