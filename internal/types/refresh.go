package types

import "time"

type RefreshToken struct {
	PlainText string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
}
