package postgres

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base32"
	"time"

	"github.com/yaredow/glimpse-api/internal/entity"
	"github.com/yaredow/glimpse-api/internal/store/queries"
)

type TokenRepo struct {
	db *DB
}

func NewTokenRepo(db *DB) *TokenRepo {
	return &TokenRepo{
		db: db,
	}
}

func (tr *TokenRepo) CreateNew(ctx context.Context, userID int64, ttl time.Duration, scope string) (string, error) {
	random := make([]byte, 16)
	if _, err := rand.Read(random); err != nil {
		return "", err
	}

	plainText := base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(random)

	hash := sha256.Sum256([]byte(plainText))

	err := tr.db.q.CreateToken(ctx, queries.CreateTokenParams{
		Hash:   hash[:],
		UserID: userID,
		Expiry: time.Now().Add(ttl),
		Scope:  scope,
	})
	if err != nil {
		return "", err
	}

	return plainText, nil
}

func (tr *TokenRepo) GetUserByToken(ctx context.Context, plainText, scope string) (*entity.User, error) {
	hash := sha256.Sum256([]byte(plainText))

	row, err := tr.db.q.GetUserByToken(ctx, queries.GetUserByTokenParams{
		Hash:  hash[:],
		Scope: scope,
	})
	if err != nil {
		return nil, mapNotFoundError(err)
	}

	return mapUser(row.ID, row.Username, row.Email, row.PasswordHash,
		row.ShufflesRemaining, row.LastShuffleReset,
		row.ExplorationRate, row.TotalInteractions,
		row.CreatedAt, row.Activated, row.Version), nil
}

func (tr *TokenRepo) DeleteForUser(ctx context.Context, userID int64, scope string) error {
	return tr.db.q.DeleteTokensForUser(ctx, queries.DeleteTokensForUserParams{
		UserID: userID,
		Scope:  scope,
	})
}
