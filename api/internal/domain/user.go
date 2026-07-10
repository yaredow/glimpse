package domain

import "time"

type User struct {
	ID                int64      `json:"id"`
	Email             string     `json:"email"`
	Password          Password   `json:"-"`
	Name              string     `json:"name"`
	Activated         bool       `json:"activated"`
	SuspendedAt       *time.Time `json:"suspended_at,omitempty"`
	Onboarded         bool       `json:"onboarded"`
	SkipsRemaining    int        `json:"skips_remaining"`
	SyncsRemaining    int        `json:"syncs_remaining"`
	LastResetAt       time.Time  `json:"last_reset_at"`
	TotalInteractions int        `json:"-"`
	ExplorationRate   float64    `json:"-"`
	Version           int        `json:"-"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}
