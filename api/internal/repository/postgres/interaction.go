package postgres

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/yaredow/glimpse-api/internal/entity"
	"github.com/yaredow/glimpse-api/internal/store/queries"
)

type InteractionRepo struct {
	db *DB
}

func NewInteractionRepo(db *DB) *InteractionRepo {
	return &InteractionRepo{db: db}
}

func (ir *InteractionRepo) Insert(ctx context.Context, interaction *entity.Interaction) error {
	return ir.db.q.InsertInteraction(ctx, queries.InsertInteractionParams{
		UserID:           interaction.UserID,
		MovieID:          interaction.MovieID,
		Action:           queries.ActionType(interaction.Action),
		GridSessionID:    uuid.MustParse(interaction.GridSessionID),
		GridPosition:     intPtrToPg(interaction.GridPosition),
		RevealToActionMs: intPtrToPg(interaction.RevealToActionMs),
	})
}

func intPtrToPg(p *int) pgtype.Int4 {
	if p == nil {
		return pgtype.Int4{Valid: false}
	}
	return pgtype.Int4{Int32: int32(*p), Valid: true}
}
