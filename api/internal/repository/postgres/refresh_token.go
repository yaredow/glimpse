package postgres

import (
	"context"
	"crypto/sha256"
	"errors"

	"github.com/jackc/pgx/v5"
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

func (rr *RefreshTokenRepository) DeleteAllForUser(ctx context.Context, userID int64) error {
	query := `DELETE FROM refresh_tokens WHERE user_id = $1`
	_, err := rr.pool.Exec(ctx, query, userID)

	return err
}

func (rr *RefreshTokenRepository) GetByPlainText(ctx context.Context, refreshTokenPlainText string) (*domain.RefreshToken, error) {
	hash := sha256.Sum256([]byte(refreshTokenPlainText))
	query := `
			SELECT hash, user_id, expires_at, created_at, revoked_at, family_id, replaced_by_hash
			FROM refresh_tokens
			WHERE hash = $1
		`

	var rt domain.RefreshToken
	err := rr.pool.QueryRow(ctx, query, hash[:]).Scan(
		&rt.Hash,
		&rt.UserID,
		&rt.ExpiresAt,
		&rt.CreatedAt,
		&rt.RevokedAt,
		&rt.FamilyID,
		&rt.ReplacedBy,
	)
	if err != nil {
		switch {
		case errors.Is(err, pgx.ErrNoRows):
			return nil, domain.ErrNotFound
		default:
			return nil, err
		}
	}

	return &rt, nil
}

func (rr *RefreshTokenRepository) Rotate(ctx context.Context, oldRefreshToken *domain.RefreshToken, newRefreshToken *domain.RefreshToken) (*domain.RefreshToken, error) {
	tx, err := rr.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	insertQuery := `
		INSERT INTO refresh_tokens (hash, user_id, expires_at, created_at, family_id)
		VALUES ($1, $2, $3, $4, $5)
	`

	insertArgs := []any{
		newRefreshToken.Hash,
		newRefreshToken.UserID,
		newRefreshToken.ExpiresAt,
		newRefreshToken.CreatedAt,
		newRefreshToken.FamilyID,
	}
	_, err = tx.Exec(ctx, insertQuery, insertArgs...)
	if err != nil {
		return nil, err
	}

	revokeQuery := `
		UPDATE refresh_tokens
		SET revoked_at = NOW(), replaced_by_hash = $1
		WHERE hash = $2
		AND revoked_at IS NULL
	`

	revokeArgs := []any{
		newRefreshToken.Hash,
		oldRefreshToken.Hash,
	}
	result, err := tx.Exec(ctx, revokeQuery, revokeArgs...)
	if err != nil {
		return nil, err
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected != 1 {
		return nil, domain.ErrNotFound
	}

	err = tx.Commit(ctx)
	if err != nil {
		return nil, err
	}

	return newRefreshToken, nil
}

func (rr *RefreshTokenRepository) RevokeByHash(ctx context.Context, hash []byte) error {
	query := `
		UPDATE refresh_tokens
		SET revoked_at = NOW()
		WHERE hash = $1
		AND revoked_at IS NULL
	`

	result, err := rr.pool.Exec(ctx, query, hash)
	if err != nil {
		return err
	}

	if result.RowsAffected() != 1 {
		return domain.ErrNotFound
	}

	return nil
}

func (rr *RefreshTokenRepository) RevokeByFamily(ctx context.Context, familyID string) error {
	query := `
		UPDATE refresh_tokens
		SET revoked_at = NOW()
		WHERE family_id = $1
		AND revoked_at IS NULL
	`

	_, err := rr.pool.Exec(ctx, query, familyID)
	if err != nil {
		return err
	}

	return nil
}
