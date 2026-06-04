package data

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base32"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/yaredow/glimpse-api/internal/auth"
	"github.com/yaredow/glimpse-api/internal/data/queries"
	"github.com/yaredow/glimpse-api/internal/types"
)

var ErrTokenReuse = errors.New("refresh token reuse detected")

func generateRandomToken() (string, []byte, error) {
	randomBytes := make([]byte, 32)
	if _, err := rand.Read(randomBytes); err != nil {
		return "", nil, err
	}

	plaintext := base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(randomBytes)
	hash := sha256.Sum256([]byte(plaintext))

	return plaintext, hash[:], nil
}

// Create new refresh token
func (s *Store) NewRefreshToken(ctx context.Context, userID int64, ttl time.Duration) (*types.RefreshToken, error) {
	plaintext, hash, err := generateRandomToken()
	if err != nil {
		return nil, err
	}

	familyID := uuid.New()
	expiresAt := time.Now().Add(ttl)

	err = s.Queries.CreateRefreshToken(ctx, queries.CreateRefreshTokenParams{
		Hash:      hash,
		UserID:    userID,
		ExpiresAt: pgtype.Timestamptz{Time: expiresAt, Valid: true},
		FamilyID:  pgtype.UUID{Bytes: familyID, Valid: true},
	})

	return &types.RefreshToken{
		PlainText: plaintext,
		ExpiresAt: expiresAt,
	}, err
}

// RotateRefreshToken replaces an old token with a new one. Revokes family on reuse.
func (s *Store) RotateRefreshToken(ctx context.Context, oldPlaintext string, ttl time.Duration) (*types.RefreshToken, int64, error) {
	hash := sha256.Sum256([]byte(oldPlaintext))

	var newPlaintext string
	var userID int64

	err := s.ExecTx(ctx, func(q *queries.Queries) error {
		// 1. Get old token
		oldToken, err := q.GetRefreshToken(ctx, hash[:])
		if err != nil {
			return err
		}

		userID = oldToken.UserID

		// 2. Detect reuse
		if oldToken.RevokedAt.Valid || oldToken.ReplacedByHash != nil {
			_ = q.RevokeTokenFamily(ctx, oldToken.FamilyID)
			return ErrTokenReuse
		}

		// 3. Check expiry
		if oldToken.ExpiresAt.Time.Before(time.Now()) {
			return auth.ErrExpiredToken
		}

		// 4. Generate new pair
		newPlain, newHash, err := generateRandomToken()
		if err != nil {
			return err
		}
		newPlaintext = newPlain

		// 5. Persist new token
		err = q.CreateRefreshToken(ctx, queries.CreateRefreshTokenParams{
			Hash:      newHash,
			UserID:    oldToken.UserID,
			ExpiresAt: pgtype.Timestamptz{Time: time.Now().Add(ttl), Valid: true},
			FamilyID:  oldToken.FamilyID,
		})
		if err != nil {
			return err
		}

		// 6. Link tokens
		err = q.SetTokenReplacement(ctx, queries.SetTokenReplacementParams{
			Hash:           oldToken.Hash,
			ReplacedByHash: newHash,
		})
		if err != nil {
			return err
		}

		// 7. Revoke old
		return q.RevokeRefreshToken(ctx, oldToken.Hash)
	})

	return &types.RefreshToken{
		PlainText: newPlaintext,
		ExpiresAt: time.Now().Add(ttl),
	}, userID, err
}
