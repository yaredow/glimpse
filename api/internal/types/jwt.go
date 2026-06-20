package types

import "time"

type JWT struct {
	Token  string    `json:"token"`
	Expiry time.Time `json:"expiry"`
}
