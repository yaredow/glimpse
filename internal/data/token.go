package data

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base32"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/yaredow/glimpse-api/internal/data/queries"
	"github.com/yaredow/glimpse-api/internal/validator"
)

const ScopeAuthentication = "authentication"

// Token represents a single-use token for authentication or other scoped actions.
type Token struct {
	PlainText string    `json:"token"`
	Hash      []byte    `json:"-"`
	UserID    int64     `json:"-"`
	Expiry    time.Time `json:"expiry"`
	Scope     string    `json:"-"`
}

func GenerateAccessToken(userID int64, ttl time.Duration, scope string) (*Token, error) {
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

// ValidateToken ensures a provided token plaintext is well-formed.
func ValidateToken(v *validator.Validator, tokenPlainText string) {
	v.Check(tokenPlainText != "", "token", "must be provided")
	v.Check(len(tokenPlainText) == 26, "token", "must be 26 bytes long")
}

// NewToken creates a new token for a specific user and scope, and persists it to the database.
func (s *Store) NewToken(ctx context.Context, userID int64, ttl time.Duration, scope string) (*Token, error) {
	token, err := GenerateAccessToken(userID, ttl, scope)
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
