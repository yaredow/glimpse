package types

import (
	"errors"

	"golang.org/x/crypto/bcrypt"
)

// Password is a named type for []byte.
type Password []byte

// Set calculates the bcrypt hash of a plaintext password and stores it.
func (p *Password) Set(plaintextPassword string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(plaintextPassword), 12)
	if err != nil {
		return err
	}

	*p = Password(hash)
	return nil
}

// Matches checks whether the provided plaintext password matches the hashed password.
func (p Password) Matches(plaintextPassword string) (bool, error) {
	err := bcrypt.CompareHashAndPassword([]byte(p), []byte(plaintextPassword))
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
