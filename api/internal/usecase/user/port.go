package userusecase

import (
	"context"
	"time"

	"github.com/google/uuid"
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

	CreateRefreshToken(ctx context.Context, userID int64, familyID uuid.UUID, ttl time.Duration) (string, error)
	RotateRefreshToken(ctx context.Context, oldPlainText string, ttl time.Duration) (newPlainText string, userID int64, err error)
	RevokeRefreshToken(ctx context.Context, plainText string) error
}

type JWTService interface {
	GenerateToken(userID int64) (string, time.Time, error)
}

type Mailer interface {
	Send(recipient, template string, data any) error
}
