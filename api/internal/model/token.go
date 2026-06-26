package model

import "time"

type Token struct {
	Hash      []byte     `json:"-"`
	UserID    int64      `json:"-"`
	Expiry    time.Time  `json:"expiry"`
	Scope     string     `json:"scope"`
	UsedAt    *time.Time `json:"used_at,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

type RefreshToken struct {
	Hash       []byte     `json:"-"`
	UserID     int64      `json:"-"`
	ExpiresAt  time.Time  `json:"expires_at"`
	CreatedAt  time.Time  `json:"created_at"`
	RevokedAt  *time.Time `json:"revoked_at,omitempty"`
	FamilyID   string     `json:"-"`
	ReplacedBy []byte     `json:"-"`
}
