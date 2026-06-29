package postgres

import (
	"context"

	"github.com/yaredow/glimpse-api/internal/domain"
)

type TokenRepository struct {
	pool Pool
}

func NewTokenRepository(p Pool) *TokenRepository {
	return &TokenRepository{pool: p}
}

func (tr *TokenRepository) Insert(ctx context.Context, token *domain.Token) error {
	query := `
		INSERT INTO tokens (hash, user_id, expiry, scope)
		VALUES ($1, $2, $3, $4)
	`

	args := []any{token.Hash, token.UserID, token.Expiry, token.Scope}
	_, err := tr.pool.Exec(ctx, query, args...)

	return err
}

func (tr *TokenRepository) DeleteAllForUser(ctx context.Context, scope string, userID int64) error {
	query := `
		DELETE FROM tokens
		WHERE scope = $1 AND user_id = $2
	`
	_, err := tr.pool.Exec(ctx, query, scope, userID)

	return err
}
