package postgres

import (
	"context"

	"github.com/yaredow/glimpse-api/internal/model"
)

type uRepository struct {
	pool Pool
}

func NewuRepository(p Pool) *uRepository {
	return &uRepository{
		pool: p,
	}
}

func (r *uRepository) Createu(ctx context.Context, u *model.User) error {
	query := `
		INSERT INTO us (name, email, password_hash, activated)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at, version;
	`

	args := []any{
		u.Name,
		u.Email,
		u.PasswordHash,
		u.Activated,
	}

	err := r.pool.QueryRow(ctx, query, args...).Scan(&u.ID, &u.CreatedAt, &u.UpdatedAt, &u.Version)
	if err != nil {
		return err
	}

	return nil
}
