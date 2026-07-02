package service

import (
	"context"
	"crypto/sha256"
	"errors"
	"net/mail"
	"strings"
	"time"

	"github.com/yaredow/glimpse-api/internal/domain"
)

//go:generate mockery --name UserRepository --dir . --output mocks --outpkg mocks
type UserRepository interface {
	Create(ctx context.Context, user *domain.User) error
	GetByEmail(ctx context.Context, email string) (*domain.User, error)
	GetByID(ctx context.Context, id int64) (*domain.User, error)
	GetByToken(ctx context.Context, tokenPlainText string, scope string) (*domain.User, error)
	Update(ctx context.Context, user *domain.User) error
	UpdateOnboarded(ctx context.Context, userID string, onboarded bool) error
}

type TokenRepository interface {
	Insert(ctx context.Context, token *domain.Token) error
	DeleteAllForUser(ctx context.Context, scope string, userID int64) error
}

type RefreshTokenRepository interface {
	Insert(ctx context.Context, token *domain.RefreshToken) error
	DeleteAllForUser(ctx context.Context, userID int64) error
	GetByPlainText(ctx context.Context, refreshTokenPlainText string) (*domain.RefreshToken, error)
	RevokeByHash(ctx context.Context, hash []byte) error
	RevokeByFamily(ctx context.Context, familyID string) error
	Rotate(ctx context.Context, oldRefreshToken *domain.RefreshToken, newRefreshToken *domain.RefreshToken) (*domain.RefreshToken, error)
}

type UserService struct {
	repo             UserRepository
	tokenRepo        TokenRepository
	refreshTokenRepo RefreshTokenRepository
}

func NewUserService(r UserRepository, tr TokenRepository, rtr RefreshTokenRepository) *UserService {
	return &UserService{
		repo:             r,
		tokenRepo:        tr,
		refreshTokenRepo: rtr,
	}
}

func (us *UserService) Create(ctx context.Context, u *domain.User) (*domain.Token, error) {
	if u.Name == "" {
		return nil, domain.ErrNameRequired
	}

	u.Email = strings.TrimSpace(strings.ToLower(u.Email))

	if !isValidEmail(u.Email) {
		return nil, domain.ErrInvalidEmail
	}

	if len(u.Password.PlainText) < 8 {
		return nil, domain.ErrPasswordTooShort
	}

	err := u.Password.Set(u.Password.PlainText)
	if err != nil {
		return nil, err
	}

	err = us.repo.Create(ctx, u)
	if err != nil {
		return nil, err
	}

	token, err := domain.GenerateToken(u.ID, 3*24*time.Hour, "activation")
	if err != nil {
		return nil, err
	}

	err = us.tokenRepo.Insert(ctx, token)
	if err != nil {
		return nil, err
	}

	return token, nil
}

func (us *UserService) GetByID(ctx context.Context, id int64) (*domain.User, error) {
	user, err := us.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	return user, nil
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

	refreshToken, err := domain.GenerateRefreshToken(user.ID, 7*24*time.Hour, "")
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

func (us *UserService) Activate(ctx context.Context, tokenPlainText string) (*domain.User, error) {
	user, err := us.repo.GetByToken(ctx, tokenPlainText, "activation")
	if err != nil {
		return nil, err
	}

	user.Activated = true

	err = us.repo.Update(ctx, user)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrNotFound):
			return nil, domain.ErrNotFound
		default:
			return nil, err
		}
	}

	err = us.tokenRepo.DeleteAllForUser(ctx, "activation", user.ID)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (us *UserService) RequestPasswordReset(ctx context.Context, email string) (*domain.Token, error) {
	email = strings.TrimSpace(strings.ToLower(email))

	if !isValidEmail(email) {
		return nil, nil
	}

	user, err := us.repo.GetByEmail(ctx, email)
	if err != nil {
		if err == domain.ErrNotFound {
			return nil, nil
		}
		return nil, err
	}

	token, err := domain.GenerateToken(user.ID, 30*time.Minute, "password_reset")
	if err != nil {
		return nil, err
	}

	err = us.tokenRepo.DeleteAllForUser(ctx, "password_reset", user.ID)
	if err != nil {
		return nil, err
	}

	err = us.tokenRepo.Insert(ctx, token)
	if err != nil {
		return nil, err
	}

	return token, nil
}

func (us *UserService) ResetPassword(ctx context.Context, tokenPlainText, newPassword string) error {
	if len(newPassword) < 8 {
		return domain.ErrPasswordTooShort
	}

	user, err := us.repo.GetByToken(ctx, tokenPlainText, "password_reset")
	if err != nil {
		return err
	}

	err = user.Password.Set(newPassword)
	if err != nil {
		return err
	}

	err = us.repo.Update(ctx, user)
	if err != nil {
		return err
	}

	err = us.tokenRepo.DeleteAllForUser(ctx, "password_reset", user.ID)
	if err != nil {
		return err
	}

	return nil
}

func (us *UserService) RotateRefreshToken(ctx context.Context, oldPlainText string) (*domain.RefreshToken, error) {
	old, err := us.refreshTokenRepo.GetByPlainText(ctx, oldPlainText)
	if err != nil {
		return nil, err
	}

	if old.RevokedAt != nil {
		if old.ReplacedBy != nil {
			_ = us.refreshTokenRepo.RevokeByFamily(ctx, old.FamilyID)
		}
		return nil, domain.ErrNotFound
	}

	if time.Now().After(old.ExpiresAt) {
		return nil, domain.ErrNotFound
	}

	newToken, err := domain.GenerateRefreshToken(old.UserID, 7*24*time.Hour, old.FamilyID)
	if err != nil {
		return nil, err
	}

	result, err := us.refreshTokenRepo.Rotate(ctx, old, newToken)
	if err != nil {
		return nil, err
	}

	return result, nil
}

func (us *UserService) RevokeRefreshToken(ctx context.Context, plainText string) error {
	hash := sha256.Sum256([]byte(plainText))
	return us.refreshTokenRepo.RevokeByHash(ctx, hash[:])
}

func (us *UserService) UpdateOnboarded(ctx context.Context, userID string, onboarded bool) error {
	return us.repo.UpdateOnboarded(ctx, userID, onboarded)
}

func isValidEmail(email string) bool {
	_, err := mail.ParseAddress(email)
	return err == nil
}
