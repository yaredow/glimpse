package data

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base32"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/yaredow/glimpse-api/internal/auth"
	"github.com/yaredow/glimpse-api/internal/data/queries"
	"github.com/yaredow/glimpse-api/internal/types"
	"github.com/yaredow/glimpse-api/internal/validator"
)

var ErrTokenReuse = errors.New("refresh token reuse detected")

func ValidateRefreshToken(v *validator.Validator, refreshTokenPlainText string) {
	v.Check(refreshTokenPlainText != "", "refresh_token", "must be provided")
	v.Check(len(refreshTokenPlainText) == 52, "refresh_token", "must be 52 bytes long")
}

func generateRefreshToken() (string, []byte, error) {
	randomBytes := make([]byte, 32)
	if _, err := rand.Read(randomBytes); err != nil {
		return "", nil, err
	}

	plaintext := base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(randomBytes)
	hash := sha256.Sum256([]byte(plaintext))

	return plaintext, hash[:], nil
}

func (s *Store) NewRefreshToken(ctx context.Context, userID int64) (*types.RefreshToken, error) {
	plaintext, hash, err := generateRefreshToken()
	if err != nil {
		return nil, err
	}

	familyID := uuid.New()
	expiresAt := time.Now().Add(10 * time.Minute)

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

func (s *Store) RotateRefreshToken(ctx context.Context, oldPlaintext string, ttl time.Duration) (*types.RefreshToken, int64, error) {
	hash := sha256.Sum256([]byte(oldPlaintext))

	var newPlaintext string
	var userID int64

	err := s.ExecTx(ctx, func(q *queries.Queries) error {
		oldToken, err := q.GetRefreshToken(ctx, hash[:])
		if err != nil {
			return err
		}

		userID = oldToken.UserID

		if oldToken.RevokedAt.Valid || oldToken.ReplacedByHash != nil {
			_ = q.RevokeTokenFamily(ctx, oldToken.FamilyID)
			return ErrTokenReuse
		}

		if oldToken.ExpiresAt.Time.Before(time.Now()) {
			return auth.ErrExpiredToken
		}

		newPlain, newHash, err := generateRefreshToken()
		if err != nil {
			return err
		}
		newPlaintext = newPlain

		err = q.CreateRefreshToken(ctx, queries.CreateRefreshTokenParams{
			Hash:      newHash,
			UserID:    oldToken.UserID,
			ExpiresAt: pgtype.Timestamptz{Time: time.Now().Add(ttl), Valid: true},
			FamilyID:  oldToken.FamilyID,
		})
		if err != nil {
			return err
		}

		err = q.SetTokenReplacement(ctx, queries.SetTokenReplacementParams{
			Hash:           oldToken.Hash,
			ReplacedByHash: newHash,
		})
		if err != nil {
			return err
		}

		_, err = q.RevokeRefreshToken(ctx, oldToken.Hash)
		return err
	})

	return &types.RefreshToken{
		PlainText: newPlaintext,
		ExpiresAt: time.Now().Add(ttl),
	}, userID, err
}

func (s *Store) GetRefreshTokenByPlainText(ctx context.Context, refreshTokenPlainText string) (queries.RefreshToken, error) {
	hash := sha256.Sum256([]byte(refreshTokenPlainText))

	result, err := s.Queries.GetRefreshToken(ctx, hash[:])
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return queries.RefreshToken{}, ErrRecordNotFound
		}

		return queries.RefreshToken{}, err
	}

	return result, nil
}

func (s *Store) RevokeRefreshTokenByHash(ctx context.Context, refreshTokenPlainText string) error {
	hash := sha256.Sum256([]byte(refreshTokenPlainText))

	rowsAffected, err := s.Queries.RevokeRefreshToken(ctx, hash[:])
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return ErrRecordNotFound
	}
	return nil
}

func (s *Store) RevokeFamily(ctx context.Context, familyID pgtype.UUID) error {
	return s.Queries.RevokeTokenFamily(ctx, familyID)
}
