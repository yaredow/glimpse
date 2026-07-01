package domain

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base32"
	"time"

	"github.com/google/uuid"
)

type Token struct {
	Plaintext string     `json:"token"`
	Hash      []byte     `json:"-"`
	UserID    int64      `json:"-"`
	Expiry    time.Time  `json:"expiry"`
	Scope     string     `json:"scope"`
	UsedAt    *time.Time `json:"used_at,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

type RefreshToken struct {
	Plaintext  string     `json:"token"`
	Hash       []byte     `json:"-"`
	UserID     int64      `json:"-"`
	ExpiresAt  time.Time  `json:"-"`
	CreatedAt  time.Time  `json:"-"`
	RevokedAt  *time.Time `json:"revoked_at,omitempty"`
	FamilyID   string     `json:"-"`
	ReplacedBy []byte     `json:"-"`
}

func GenerateRefreshToken(userID int64, ttl time.Duration, familyID string) (*RefreshToken, error) {
	token := &RefreshToken{
		UserID:    userID,
		ExpiresAt: time.Now().Add(ttl),
		FamilyID:  familyID,
	}

	if token.FamilyID == "" {
		token.FamilyID = uuid.NewString()
	}

	randomBytes := make([]byte, 32)
	_, err := rand.Read(randomBytes)
	if err != nil {
		return nil, err
	}

	token.Plaintext = base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(randomBytes)

	hash := sha256.Sum256([]byte(token.Plaintext))
	token.Hash = hash[:]

	return token, nil
}

func GenerateToken(userID int64, ttl time.Duration, scope string) (*Token, error) {
	randomBytes := make([]byte, 16)
	_, err := rand.Read(randomBytes)
	if err != nil {
		return nil, err
	}

	plaintext := base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(randomBytes)
	hash := sha256.Sum256([]byte(plaintext))

	token := &Token{
		Plaintext: plaintext,
		Hash:      hash[:],
		UserID:    userID,
		Expiry:    time.Now().Add(ttl),
		Scope:     scope,
	}

	return token, nil
}
