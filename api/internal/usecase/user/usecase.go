package userusecase

import (
	"context"
	"errors"
	"time"

	"github.com/yaredow/glimpse-api/internal/entity"
)

type UserUsecase struct {
	userRepo  UserRespository
	tokenRepo TokenRepository
	mailer    Mailer
}

func NewUserUsecase(ur UserRespository, tr TokenRepository, m Mailer) *UserUsecase {
	return &UserUsecase{
		userRepo:  ur,
		tokenRepo: tr,
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

	token, err := uc.tokenRepo.CreateNew(ctx, user.ID, 3*24*time.Hour, "activation")
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
