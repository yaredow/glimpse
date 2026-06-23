// Package entity defines the data models for the application.
package entity

import (
	"errors"
	"net/mail"
	"time"
	"unicode/utf8"

	"golang.org/x/crypto/bcrypt"
)

type Password []byte

func (p *Password) Set(plaintext string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(plaintext), 12)
	if err != nil {
		return err
	}
	*p = Password(hash)
	return nil
}

func (p Password) Matches(plainText string) (bool, error) {
	err := bcrypt.CompareHashAndPassword([]byte(p), []byte(plainText))
	if err != nil {
		switch {
		case errors.Is(err, bcrypt.ErrMismatchedHashAndPassword):
			return false, nil
		default:
			return false, err
		}
	}
	return true, nil
}

type User struct {
	ID                int64
	Username          string
	Email             string
	PasswordHash      Password
	ShufflesRemaining int32
	LastShuffleReset  time.Time
	CreatedAt         time.Time
	Activated         bool
	Version           int32
	ExplorationRate   float64
	TotalInteractions int32
}

var (
	ErrUsernameRequired = ValidationError{Field: "username", Message: "username is required"}
	ErrUsernameTooLong  = ValidationError{Field: "username", Message: "username must not exceed 100 characters"}
	ErrEmailRequired    = ValidationError{Field: "email", Message: "email is required"}
	ErrInvalidEmail     = ValidationError{Field: "email", Message: "email is not valid"}
	ErrPasswordRequired = ValidationError{Field: "password", Message: "password is required"}
	ErrPasswordTooShort = ValidationError{Field: "password", Message: "password must be at least 8 characters"}
	ErrPasswordTooLong  = ValidationError{Field: "password", Message: "password must be at most 72 characters"}
)

func NewUser(username, email, plainTextPassword string) (*User, error) {
	if username == "" {
		return nil, ErrUsernameRequired
	}

	if utf8.RuneCountInString(username) > 100 {
		return nil, ErrUsernameTooLong
	}

	if email == "" {
		return nil, ErrEmailRequired
	}

	if _, err := mail.ParseAddress(email); err != nil {
		return nil, ErrInvalidEmail
	}

	if plainTextPassword == "" {
		return nil, ErrPasswordRequired
	}

	if len(plainTextPassword) < 8 {
		return nil, ErrPasswordTooShort
	}

	if len(plainTextPassword) > 72 {
		return nil, ErrPasswordTooLong
	}

	var pw Password
	if err := pw.Set(plainTextPassword); err != nil {
		return nil, err
	}

	now := time.Now()
	return &User{
		Username:     username,
		Email:        email,
		PasswordHash: pw,
		CreatedAt:    now,
		Version:      1,
	}, nil
}

func (u *User) IsActivated() bool {
	return u.Activated
}

func (u *User) Activate() {
	u.Activated = true
}
