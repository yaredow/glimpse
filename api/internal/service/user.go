// Package service provides business logic for the application
package service

import (
	"context"
	"net/mail"
	"strings"

	"github.com/yaredow/glimpse-api/internal/domain"
)

//go:generate mockery --name UserRepository --dir . --output mocks --outpkg mocks
type UserRepository interface {
	Create(ctx context.Context, user *domain.User) error
	GetByEmail(ctx context.Context, email string) (*domain.User, error)
}

type UserService struct {
	repo UserRepository
}

func NewUserService(r UserRepository) *UserService {
	return &UserService{
		repo: r,
	}
}

func (us *UserService) Create(ctx context.Context, u *domain.User) error {
	if u.Name == "" {
		return domain.ErrNameRequired
	}

	u.Email = strings.TrimSpace(strings.ToLower(u.Email))

	if !isValidEmail(u.Email) {
		return domain.ErrInvalidEmail
	}

	if len(u.Password.PlainText) < 8 {
		return domain.ErrPasswordTooShort
	}

	err := u.Password.Set(u.Password.PlainText)
	if err != nil {
		return err
	}

	return us.repo.Create(ctx, u)
}

func (us *UserService) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	email = strings.TrimSpace(strings.ToLower(email))

	if !isValidEmail(email) {
		return nil, domain.ErrInvalidEmail
	}

	user, err := us.repo.GetByEmail(ctx, email)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func isValidEmail(email string) bool {
	_, err := mail.ParseAddress(email)

	return err == nil
}
