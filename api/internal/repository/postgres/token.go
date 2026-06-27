package postgres

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base32"
	"time"

	"github.com/yaredow/glimpse-api/internal/domain"
)

type TokenRepository struct {
	pool Pool
}

func NewTokenRepository(p Pool) *TokenRepository {
	return &TokenRepository{pool: p}
}

func generateToken(userID int64, ttl time.Duration, scope string) (*domain.Token, error) {
	token := &domain.Token{
		UserID: userID,
		Expiry: time.Now().Add(ttl),
		Scope:  scope,
	}

	randomByte := make([]byte, 16)
	_, err := rand.Read(randomByte)
	if err != nil {
		return nil, err
	}

	token.Plaintext = base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(randomByte)
	hash := sha256.Sum256([]byte(token.Plaintext))
	token.Hash = hash[:]

	return token, nil
}

func (tr *TokenRepository) New(ctx context.Context, userID int64, ttl time.Duration, scope string) (*domain.Token, error) {
	token, err := generateToken(userID, ttl, scope)
	if err != nil {
		return nil, err
	}

	err = tr.Insert(ctx, token)
	if err != nil {
		return nil, err
	}

	return token, nil
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
