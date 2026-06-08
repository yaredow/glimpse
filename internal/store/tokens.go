// Package store provides a database-backed implementation of the auth package.
package store

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
	"github.com/yaredow/glimpse-api/internal/store/queries"
	"github.com/yaredow/glimpse-api/internal/types"
	"github.com/yaredow/glimpse-api/internal/validator"
)

const (
	ScopeActivation    = "activation"
	ScopeRefreshToken  = "refresh_token"
	ScopePasswordReset = "password_reset"
)

const (
	RefreshTokenTTL       = 7 * 24 * time.Hour
	ActivationTokenTTL    = 3 * 24 * time.Hour
	PasswordResetTokenTTL = 24 * time.Hour
)

// Token represents a single-use token for authentication or other scoped actions.
type Token struct {
	PlainText string    `json:"token"`
	Hash      []byte    `json:"-"`
	UserID    int64     `json:"-"`
	Expiry    time.Time `json:"-"`
	Scope     string    `json:"-"`
}

func generateToken(userID int64, ttl time.Duration, scope string) (*Token, error) {
	token := &Token{
		UserID: userID,
		Expiry: time.Now().Add(ttl),
		Scope:  scope,
	}

	randomBytes := make([]byte, 16)

	_, err := rand.Read(randomBytes)
	if err != nil {
		return nil, err
	}

	token.PlainText = base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(randomBytes)
	hash := sha256.Sum256([]byte(token.PlainText))
	token.Hash = hash[:]

	return token, nil
}

func ValidateToken(v *validator.Validator, tokenPlainText, field string) {
	v.Check(tokenPlainText != "", field, "must be provided")
	v.Check(len(tokenPlainText) == 26, field, "must be 26 bytes long")
}

func (s *Store) CreateNewToken(ctx context.Context, userID int64, ttl time.Duration, scope string) (*Token, error) {
	token, err := generateToken(userID, ttl, scope)
	if err != nil {
		return nil, err
	}

	err = s.Queries.CreateToken(ctx, queries.CreateTokenParams{
		Hash:   token.Hash,
		UserID: token.UserID,
		Expiry: pgtype.Timestamptz{Time: token.Expiry, Valid: true},
		Scope:  token.Scope,
	})
	if err != nil {
		return nil, err
	}

	return token, nil
}

func (s *Store) CreateNewRefreshToken(ctx context.Context, userID int64) (*types.Tokens, error) {
	token, err := generateToken(userID, RefreshTokenTTL, ScopeRefreshToken)
	if err != nil {
		return nil, err
	}

	familyID := uuid.New()

	err = s.Queries.CreateRefreshToken(ctx, queries.CreateRefreshTokenParams{
		Hash:      token.Hash,
		UserID:    token.UserID,
		ExpiresAt: pgtype.Timestamptz{Time: token.Expiry, Valid: true},
		FamilyID:  pgtype.UUID{Bytes: familyID, Valid: true},
	})
	if err != nil {
		return nil, err
	}

	return &types.Tokens{
		PlainText: token.PlainText,
		UserID:    token.UserID,
	}, nil
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

func (s *Store) GetUserByToken(ctx context.Context, tokenPlainText string, scope string) (queries.User, error) {
	hash := sha256.Sum256([]byte(tokenPlainText))
	args := queries.GetUserByTokenParams{
		Hash:  hash[:],
		Scope: scope,
	}

	result, err := s.Queries.GetUserByToken(ctx, args)
	if err != nil {
		switch {
		case errors.Is(err, pgx.ErrNoRows):
			return queries.User{}, ErrRecordNotFound
		default:
			return queries.User{}, err
		}
	}

	return result, nil
}

func (s *Store) RotateRefreshToken(ctx context.Context, oldPlaintext string, ttl time.Duration) (*types.Tokens, error) {
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

		token, err := generateToken(userID, RefreshTokenTTL, ScopeRefreshToken)
		if err != nil {
			return err
		}
		newPlaintext = token.PlainText

		err = q.CreateRefreshToken(ctx, queries.CreateRefreshTokenParams{
			Hash:      token.Hash,
			UserID:    oldToken.UserID,
			ExpiresAt: pgtype.Timestamptz{Time: time.Now().Add(ttl), Valid: true},
			FamilyID:  oldToken.FamilyID,
		})
		if err != nil {
			return err
		}

		err = q.SetTokenReplacement(ctx, queries.SetTokenReplacementParams{
			Hash:           oldToken.Hash,
			ReplacedByHash: token.Hash,
		})
		if err != nil {
			return err
		}

		_, err = q.RevokeRefreshToken(ctx, oldToken.Hash)
		return err
	})

	return &types.Tokens{
		PlainText: newPlaintext,
		UserID:    userID,
	}, err
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

func (s *Store) DeleteTokensForUser(ctx context.Context, userID int64, scope string) error {
	args := queries.DeleteTokensForUserParams{
		UserID: userID,
		Scope:  scope,
	}

	return s.Queries.DeleteTokensForUser(ctx, args)
}

func (s *Store) RevokeFamily(ctx context.Context, familyID pgtype.UUID) error {
	return s.Queries.RevokeTokenFamily(ctx, familyID)
}
