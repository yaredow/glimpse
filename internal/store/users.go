package store

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/yaredow/glimpse-api/internal/store/queries"
	"github.com/yaredow/glimpse-api/internal/types"
	"github.com/yaredow/glimpse-api/internal/validator"
)

func (s *Store) CreateUser(ctx context.Context, username, email, password string) (queries.CreateUserRow, error) {
	var pw types.Password
	err := pw.Set(password)
	if err != nil {
		return queries.CreateUserRow{}, err
	}

	result, err := s.Queries.CreateUser(ctx, queries.CreateUserParams{
		Username:     username,
		Email:        email,
		PasswordHash: pw,
	})
	if err != nil {
		return queries.CreateUserRow{}, err
	}

	return result, nil
}

func (s *Store) UpdateUser(ctx context.Context, user *queries.User) error {
	result, err := s.Queries.UpdateUser(ctx, queries.UpdateUserParams{
		ID:           user.ID,
		Username:     user.Username,
		Email:        user.Email,
		PasswordHash: user.PasswordHash,
		Activated:    user.Activated,
		Version:      user.Version,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrEditConflict
		}
		return err
	}
	user.Version = result.Version

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

func ValidateUser(v *validator.Validator, username, email string) {
	v.Check(username != "", "username", "must be provided")
	v.Check(len(username) <= 100, "username", "must not be more than 100 characters")

	ValidateEmail(v, email)
}
