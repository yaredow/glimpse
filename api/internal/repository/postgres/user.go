package postgres

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/yaredow/glimpse-api/internal/domain"
)

type UserRespository struct {
	pool Pool
}

func NewUserRepository(p Pool) *UserRespository {
	return &UserRespository{
		pool: p,
	}
}

func (r *UserRespository) Create(ctx context.Context, u *domain.User) error {
	query := `
		INSERT INTO users (name, email, password_hash)
		VALUES ($1, $2, $3)
		RETURNING id, activated, onboarded, skips_remaining, syncs_remaining,
          last_reset_at, version, created_at
	`

	args := []any{
		u.Name,
		u.Email,
		u.Password.Hash,
	}

	err := r.pool.QueryRow(ctx, query, args...).Scan(
		&u.ID,
		&u.Activated,
		&u.Onboarded,
		&u.SkipsRemaining,
		&u.SyncsRemaining,
		&u.LastResetAt,
		&u.Version,
		&u.CreatedAt,
	)
	if err != nil {
		return err
	}

	return nil
}

func (ur *UserRespository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	query := `
	SELECT id, name, email, password_hash, activated, suspended_at, onboarded, skips_remaining, syncs_remaining, last_reset_at, version, created_at, updated_at
	From users
	WHERE email = $1
	`

	var u domain.User
	err := ur.pool.QueryRow(ctx, query, email).Scan(
		&u.ID,
		&u.Name,
		&u.Email,
		&u.Password.Hash,
		&u.Activated,
		&u.SuspendedAt,
		&u.Onboarded,
		&u.SkipsRemaining,
		&u.SyncsRemaining,
		&u.LastResetAt,
		&u.Version,
		&u.CreatedAt,
		&u.UpdatedAt,
	)
	if err != nil {
		switch {
		case errors.Is(err, pgx.ErrNoRows):
			return nil, domain.ErrNotFound
		default:
			return nil, err
		}
	}

	return &u, nil
}

func (ur *UserRespository) GetByID(ctx context.Context, id int64) (*domain.User, error) {
	query := `
	SELECT id, name, email, password_hash, activated, suspended_at, onboarded, skips_remaining, syncs_remaining, last_reset_at, version, created_at, updated_at
	From users
	WHERE id = $1
	`

	var u domain.User
	err := ur.pool.QueryRow(ctx, query, id).Scan(
		&u.ID,
		&u.Name,
		&u.Email,
		&u.Password.Hash,
		&u.Activated,
		&u.SuspendedAt,
		&u.Onboarded,
		&u.SkipsRemaining,
		&u.SyncsRemaining,
		&u.LastResetAt,
		&u.Version,
		&u.CreatedAt,
		&u.UpdatedAt,
	)
	if err != nil {
		switch {
		case errors.Is(err, pgx.ErrNoRows):
			return nil, domain.ErrNotFound
		default:
			return nil, err
		}
	}

	return &u, nil
}
