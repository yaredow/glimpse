package postgres

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base32"
	"time"

	"github.com/google/uuid"
	"github.com/yaredow/glimpse-api/internal/entity"
	"github.com/yaredow/glimpse-api/internal/store/queries"
	userusecase "github.com/yaredow/glimpse-api/internal/usecase/user"
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

func (tr *TokenRepo) CreateRefreshToken(ctx context.Context, userID int64, familyID uuid.UUID, ttl time.Duration) (string, error) {
	random := make([]byte, 16)
	if _, err := rand.Read(random); err != nil {
		return "", err
	}

	plainText := base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(random)
	hash := sha256.Sum256([]byte(plainText))

	err := tr.db.q.CreateRefreshToken(ctx, queries.CreateRefreshTokenParams{
		Hash:      hash[:],
		UserID:    userID,
		ExpiresAt: time.Now().Add(ttl),
		FamilyID:  familyID,
	})
	if err != nil {
		return "", err
	}

	return plainText, nil
}

func (tr *TokenRepo) RotateRefreshToken(ctx context.Context, oldPlainText string, ttl time.Duration) (string, int64, error) {
	hash := sha256.Sum256([]byte(oldPlainText))

	var newPlainText string
	var userID int64

	err := tr.db.ExecTx(ctx, func(q *queries.Queries) error {
		oldToken, err := q.GetRefreshToken(ctx, hash[:])
		if err != nil {
			return err
		}

		userID = oldToken.UserID

		if oldToken.RevokedAt.Valid || oldToken.ReplacedByHash != nil {
			_ = q.RevokeTokenFamily(ctx, oldToken.FamilyID)
			return userusecase.ErrTokenReuse
		}

		if oldToken.ExpiresAt.Before(time.Now()) {
			return userusecase.ErrRefreshTokenExpired
		}

		random := make([]byte, 16)
		if _, err := rand.Read(random); err != nil {
			return err
		}

		newPlainText = base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(random)
		newHash := sha256.Sum256([]byte(newPlainText))

		err = q.CreateRefreshToken(ctx, queries.CreateRefreshTokenParams{
			Hash:      newHash[:],
			UserID:    oldToken.UserID,
			ExpiresAt: time.Now().Add(ttl),
			FamilyID:  oldToken.FamilyID,
		})
		if err != nil {
			return err
		}

		err = q.SetTokenReplacement(ctx, queries.SetTokenReplacementParams{
			Hash:           oldToken.Hash,
			ReplacedByHash: newHash[:],
		})
		if err != nil {
			return err
		}

		_, err = q.RevokeRefreshToken(ctx, oldToken.Hash)
		return err
	})
	if err != nil {
		return "", 0, err
	}

	return newPlainText, userID, nil
}

func (tr *TokenRepo) RevokeRefreshToken(ctx context.Context, plainText string) error {
	hash := sha256.Sum256([]byte(plainText))

	rowsAffected, err := tr.db.q.RevokeRefreshToken(ctx, hash[:])
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return userusecase.ErrRecordNotFound
	}

	return nil
}
