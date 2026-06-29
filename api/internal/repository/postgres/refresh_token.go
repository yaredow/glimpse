package postgres

import (
	"context"

	"github.com/yaredow/glimpse-api/internal/domain"
)

type RefreshTokenRepository struct {
	pool Pool
}

func NewRefreshTokenRepository(p Pool) *RefreshTokenRepository {
	return &RefreshTokenRepository{pool: p}
}

func (r *RefreshTokenRepository) Insert(ctx context.Context, token *domain.RefreshToken) error {
	query := `
		INSERT INTO refresh_tokens (hash, user_id, expires_at, created_at, family_id)
		VALUES ($1, $2, $3, $4, $5)
	`

	args := []any{token.Hash, token.UserID, token.ExpiresAt, token.CreatedAt, token.FamilyID}
	_, err := r.pool.Exec(ctx, query, args...)

	return err
}

func (r *RefreshTokenRepository) DeleteAllForUser(ctx context.Context, userID int64) error {
	query := `DELETE FROM refresh_tokens WHERE user_id = $1`
	_, err := r.pool.Exec(ctx, query, userID)

	return err
}
