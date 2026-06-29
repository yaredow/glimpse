package service

import (
	"context"
	"time"

	"github.com/yaredow/glimpse-api/internal/domain"
)

type TokenRepository interface {
	Insert(ctx context.Context, token *domain.Token) error
	DeleteAllForUser(ctx context.Context, scope string, userID int64) error
}

type RefreshTokenRepository interface {
	Insert(ctx context.Context, token *domain.RefreshToken) error
	DeleteAllForUser(ctx context.Context, userID int64) error
}

type TokenService struct {
	repo TokenRepository
}

func NewTokenService(r TokenRepository) *TokenService {
	return &TokenService{repo: r}
}

func (ts *TokenService) Insert(ctx context.Context, token *domain.Token) error {
	return ts.repo.Insert(ctx, token)
}

func (ts *TokenService) NewToken(ctx context.Context, userID int64, ttl time.Duration, scope string) (*domain.Token, error) {
	token, err := domain.GenerateToken(userID, ttl, scope)
	if err != nil {
		return nil, err
	}

	err = ts.repo.Insert(ctx, token)
	if err != nil {
		return nil, err
	}

	return token, nil
}

func (ts *TokenService) DeleteAllForUser(ctx context.Context, scope string, userID int64) error {
	return ts.repo.DeleteAllForUser(ctx, scope, userID)
}
