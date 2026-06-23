// Package userusecase provides the user usecase.
package userusecase

import (
	"context"
	"time"

	"github.com/yaredow/glimpse-api/internal/entity"
)

type UserRespository interface {
	Create(ctx context.Context, user *entity.User) error
	GetByID(ctx context.Context, id int64) (*entity.User, error)
	GetByEmail(ctx context.Context, email string) (*entity.User, error)
	Update(ctx context.Context, user *entity.User) error
}

type TokenRepository interface {
	CreateNew(ctx context.Context, userID int64, ttl time.Duration, scope string) (string, error)
	GetUserByToken(ctx context.Context, plainText, scope string) (*entity.User, error)
	DeleteForUser(ctx context.Context, userID int64, scope string) error
}

type Mailer interface {
	Send(recipient, template string, data any) error
}
