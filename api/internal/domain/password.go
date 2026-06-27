package domain

import (
	"errors"

	"golang.org/x/crypto/bcrypt"
)

type Password struct {
	PlainText string `json:"-"`
	Hash      []byte `json:"-"`
}

func (p *Password) Set(plainText string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(plainText), 12)
	if err != nil {
		return err
	}
	p.Hash = hash
	p.PlainText = plainText
	return nil
}

func (p *Password) Match(plainText string) (bool, error) {
	err := bcrypt.CompareHashAndPassword(p.Hash, []byte(plainText))
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
