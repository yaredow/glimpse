package data

import (
	"github.com/yaredow/glimpse-api/internal/validator"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	Username string   `json:"username"`
	Email    string   `json:"email"`
	Password password `json:"-"`
}

type password struct {
	plainText *string
	Hash      []byte
}

func (p *password) Set(plaintextPassword string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(plaintextPassword), 12)
	if err != nil {
		return err
	}

	p.plainText = &plaintextPassword
	p.Hash = hash
	return nil
}

func ValidateEmail(v *validator.Validator, email string) {
	v.Check(email != "", "email", "must be provided")
	v.Check(validator.Matches(email, validator.EmailRX), "email", "must be a valid email address")
}

func ValidatePasswordPlainText(v *validator.Validator, password string) {
	v.Check(password != "", "password", "must be provided")
	v.Check(len(password) >= 8, "password", "must be at least 8 characters long")
	v.Check(len(password) <= 72, "password", "must not be more than 72 characters long")
}

func ValidateUser(v *validator.Validator, user *User) {
	v.Check(user.Username != "", "username", "must be provided")
	v.Check(len(user.Username) <= 100, "username", "must not be more than 100 characters")

	ValidateEmail(v, user.Email)

	if user.Password.plainText != nil {
		ValidatePasswordPlainText(v, *user.Password.plainText)
	}
}
