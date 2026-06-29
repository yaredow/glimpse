package service

import (
	"context"
	"net/mail"
	"strings"
	"time"

	"github.com/yaredow/glimpse-api/internal/domain"
)

//go:generate mockery --name UserRepository --dir . --output mocks --outpkg mocks
type UserRepository interface {
	Create(ctx context.Context, user *domain.User) error
	GetByEmail(ctx context.Context, email string) (*domain.User, error)
	GetByToken(ctx context.Context, tokenPlainText string, scope string) (*domain.User, error)
	Update(ctx context.Context, user *domain.User) error
}

type UserService struct {
	repo           UserRepository
	tokenRepo      TokenRepository
	refreshTokenRepo RefreshTokenRepository
}

func NewUserService(r UserRepository, tr TokenRepository, rtr RefreshTokenRepository) *UserService {
	return &UserService{
		repo:             r,
		tokenRepo:        tr,
		refreshTokenRepo: rtr,
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

func (us *UserService) GetByToken(ctx context.Context, tokenPlainText string, scope string) (*domain.User, error) {
	user, err := us.repo.GetByToken(ctx, tokenPlainText, scope)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (us *UserService) Update(ctx context.Context, u *domain.User) error {
	if u.Name == "" {
		return domain.ErrNameRequired
	}

	u.Email = strings.TrimSpace(strings.ToLower(u.Email))

	if !isValidEmail(u.Email) {
		return domain.ErrInvalidEmail
	}

	return us.repo.Update(ctx, u)
}

func (us *UserService) Authenticate(ctx context.Context, email, password string) (*domain.User, *domain.RefreshToken, error) {
	email = strings.TrimSpace(strings.ToLower(email))

	if !isValidEmail(email) {
		return nil, nil, domain.ErrInvalidEmail
	}

	user, err := us.repo.GetByEmail(ctx, email)
	if err != nil {
		if err == domain.ErrNotFound {
			return nil, nil, domain.ErrInvalidCredentials
		}
		return nil, nil, err
	}

	match, err := user.Password.Match(password)
	if err != nil {
		return nil, nil, err
	}
	if !match {
		return nil, nil, domain.ErrInvalidCredentials
	}

	refreshToken, err := domain.GenerateRefreshToken(user.ID, 7*24*time.Hour)
	if err != nil {
		return nil, nil, err
	}

	err = us.refreshTokenRepo.DeleteAllForUser(ctx, user.ID)
	if err != nil {
		return nil, nil, err
	}

	err = us.refreshTokenRepo.Insert(ctx, refreshToken)
	if err != nil {
		return nil, nil, err
	}

	return user, refreshToken, nil
}

func isValidEmail(email string) bool {
	_, err := mail.ParseAddress(email)
	return err == nil
}
