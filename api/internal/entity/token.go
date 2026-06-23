package entity

import (
	"time"

	"github.com/google/uuid"
)

type RefreshToken struct {
	Hash           []byte
	UserID         int64
	ExpiresAt      time.Time
	CreatedAt      time.Time
	RevokedAt      *time.Time
	FamilyID       uuid.UUID
	ReplacedByHash []byte
}
