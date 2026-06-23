// Package userusecase is the user usecase package.
package userusecase

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/yaredow/glimpse-api/internal/entity"
)

const (
	refreshTokenTTL       = 7 * 24 * time.Hour
	activationTokenTTL    = 3 * 24 * time.Hour
	passwordResetTokenTTL = 24 * time.Hour
)

type UserUsecase struct {
	userRepo  UserRespository
	tokenRepo TokenRepository
	jwt       JWTService
	mailer    Mailer
}

func NewUserUsecase(ur UserRespository, tr TokenRepository, j JWTService, m Mailer) *UserUsecase {
	return &UserUsecase{
		userRepo:  ur,
		tokenRepo: tr,
		jwt:       j,
		mailer:    m,
	}
}

func (uc *UserUsecase) Register(ctx context.Context, input RegisterInput) (*RegisterOutput, error) {
	user, err := entity.NewUser(input.Username, input.Email, input.Password)
	if err != nil {
		return nil, err
	}

	err = uc.userRepo.Create(ctx, user)
	if err != nil {
		return nil, err
	}

	token, err := uc.tokenRepo.CreateNew(ctx, user.ID, activationTokenTTL, "activation")
	if err != nil {
		return nil, err
	}

	go uc.mailer.Send(user.Email, "user_welcome.html", map[string]any{
		"activationToken": token,
	})

	return &RegisterOutput{
		User:            user,
		ActivationToken: token,
	}, nil
}

func (uc *UserUsecase) GetByEmail(ctx context.Context, email string) (*entity.User, error) {
	return uc.userRepo.GetByEmail(ctx, email)
}

func (uc *UserUsecase) Activate(ctx context.Context, tokenPlainText string) error {
	user, err := uc.tokenRepo.GetUserByToken(ctx, tokenPlainText, "activation")
	if err != nil {
		if errors.Is(err, ErrRecordNotFound) {
			return ErrRecordNotFound
		}
		return err
	}

	user.Activate()

	if err := uc.userRepo.Update(ctx, user); err != nil {
		return err
	}

	return uc.tokenRepo.DeleteForUser(ctx, user.ID, "activation")
}

func (uc *UserUsecase) ResetPassword(ctx context.Context, tokenPlainText, newPassword string) error {
	user, err := uc.tokenRepo.GetUserByToken(ctx, tokenPlainText, "password_reset")
	if err != nil {
		if errors.Is(err, ErrRecordNotFound) {
			return ErrRecordNotFound
		}
		return err
	}

	if err = user.PasswordHash.Set(newPassword); err != nil {
		return err
	}

	if err := uc.userRepo.Update(ctx, user); err != nil {
		return err
	}

	return uc.tokenRepo.DeleteForUser(ctx, user.ID, "password_reset")
}

func (uc *UserUsecase) Login(ctx context.Context, email, password string) (accessToken string, refreshToken string, err error) {
	user, err := uc.userRepo.GetByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, ErrRecordNotFound) {
			return "", "", ErrInvalidCredentials
		}
		return "", "", err
	}

	match, err := user.PasswordHash.Matches(password)
	if err != nil {
		return "", "", err
	}

	if !match {
		return "", "", ErrInvalidCredentials
	}

	accessToken, _, err = uc.jwt.GenerateToken(user.ID)
	if err != nil {
		return "", "", err
	}

	refreshToken, err = uc.tokenRepo.CreateRefreshToken(ctx, user.ID, uuid.New(), refreshTokenTTL)
	if err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}

func (uc *UserUsecase) RefreshToken(ctx context.Context, refreshTokenPlainText string) (accessToken string, newRefreshToken string, err error) {
	newRefreshToken, userID, err := uc.tokenRepo.RotateRefreshToken(ctx, refreshTokenPlainText, refreshTokenTTL)
	if err != nil {
		return "", "", err
	}

	accessToken, _, err = uc.jwt.GenerateToken(userID)
	if err != nil {
		return "", "", err
	}

	return accessToken, newRefreshToken, nil
}

func (uc *UserUsecase) RevokeToken(ctx context.Context, refreshTokenPlainText string) error {
	return uc.tokenRepo.RevokeRefreshToken(ctx, refreshTokenPlainText)
}

func (uc *UserUsecase) CreateActivationToken(ctx context.Context, email string) error {
	user, err := uc.userRepo.GetByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, ErrRecordNotFound) {
			return entity.ValidationError{Field: "email", Message: "no user with this email address exists"}
		}
		return err
	}

	if user.Activated {
		return entity.ValidationError{Field: "email", Message: "user with this email address already activated"}
	}

	token, err := uc.tokenRepo.CreateNew(ctx, user.ID, activationTokenTTL, "activation")
	if err != nil {
		return err
	}

	go uc.mailer.Send(user.Email, "token_activation.html", map[string]any{
		"activationToken": token,
	})

	return nil
}

func (uc *UserUsecase) CreatePasswordResetToken(ctx context.Context, email string) error {
	user, err := uc.userRepo.GetByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, ErrRecordNotFound) {
			return entity.ValidationError{Field: "email", Message: "no user with this email address exists"}
		}
		return err
	}

	if !user.Activated {
		return entity.ValidationError{Field: "email", Message: "user account is not activated"}
	}

	token, err := uc.tokenRepo.CreateNew(ctx, user.ID, passwordResetTokenTTL, "password_reset")
	if err != nil {
		return err
	}

	go uc.mailer.Send(user.Email, "token_password_reset.html", map[string]any{
		"passwordResetToken": token,
	})

	return nil
}
