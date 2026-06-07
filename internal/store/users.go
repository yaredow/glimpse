package store

import (
	"github.com/yaredow/glimpse-api/internal/validator"
)

// ValidateEmail performs standard email validation.
func ValidateEmail(v *validator.Validator, email string) {
	v.Check(email != "", "email", "must be provided")
	v.Check(validator.Matches(email, validator.EmailRX), "email", "must be a valid email address")
}

// ValidatePasswordPlainText ensures the plaintext password meets security requirements.
func ValidatePasswordPlainText(v *validator.Validator, password string) {
	v.Check(password != "", "password", "must be provided")
	v.Check(len(password) >= 8, "password", "must be at least 8 characters long")
	v.Check(len(password) <= 72, "password", "must not be more than 72 characters long")
}

// ValidateUser performs high-level validation for user registration.
func ValidateUser(v *validator.Validator, username, email string) {
	v.Check(username != "", "username", "must be provided")
	v.Check(len(username) <= 100, "username", "must not be more than 100 characters")

	ValidateEmail(v, email)
}
