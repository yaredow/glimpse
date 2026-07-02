package postgres

import (
	"context"
	"crypto/sha256"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/yaredow/glimpse-api/internal/domain"
)

type UserRespository struct {
	db *DB
}

func NewUserRepository(db *DB) *UserRespository {
	return &UserRespository{
		db: db,
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

	err := r.db.QueryRow(ctx, query, args...).Scan(
		&u.ID,
		&u.Activated,
		&u.Onboarded,
		&u.SkipsRemaining,
		&u.SyncsRemaining,
		&u.LastResetAt,
		&u.Version,
		&u.CreatedAt,
	)

	var pgErr *pgconn.PgError
	if err != nil {
		switch {
		case errors.As(err, &pgErr) && pgErr.Code == "23505":
			return domain.ErrDuplicateEmail
		default:
			return err
		}
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
	err := ur.db.QueryRow(ctx, query, email).Scan(
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
	err := ur.db.QueryRow(ctx, query, id).Scan(
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

func (ur *UserRespository) GetByToken(ctx context.Context, tokenPlainText string, scope string) (*domain.User, error) {
	hash := sha256.Sum256([]byte(tokenPlainText))

	query := `
		SELECT users.id, users.name, users.email, users.password_hash, users.activated,
		       users.suspended_at, users.onboarded, users.skips_remaining,
		       users.syncs_remaining, users.last_reset_at, users.version,
		       users.created_at, users.updated_at
		FROM users
		INNER JOIN tokens ON users.id = tokens.user_id
		WHERE tokens.hash = $1
		  AND tokens.scope = $2
		  AND tokens.expiry > now()
	`

	var u domain.User
	err := ur.db.QueryRow(ctx, query, hash[:], scope).Scan(
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

func (ur *UserRespository) Update(ctx context.Context, user *domain.User) error {
	query := `
        UPDATE users
        SET name = $1, email = $2, password_hash = $3, activated = $4, version = version + 1
        WHERE id = $5 AND version = $6
        RETURNING id, name, email, password_hash, activated, suspended_at, onboarded,
                  skips_remaining, syncs_remaining, last_reset_at, version, created_at, updated_at
    `

	err := ur.db.QueryRow(ctx, query,
		user.Name,
		user.Email,
		user.Password.Hash,
		user.Activated,
		user.ID,
		user.Version,
	).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.Password.Hash,
		&user.Activated,
		&user.SuspendedAt,
		&user.Onboarded,
		&user.SkipsRemaining,
		&user.SyncsRemaining,
		&user.LastResetAt,
		&user.Version,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	var pgErr *pgconn.PgError
	if err != nil {
		switch {
		case errors.Is(err, pgx.ErrNoRows):
			return domain.ErrEditConflict
		case errors.As(err, &pgErr) && pgErr.Code == "23505":
			return domain.ErrDuplicateEmail
		default:
			return err
		}
	}

	return nil
}

func (ur *UserRespository) UpdateOnboarded(ctx context.Context, userID string, onboarded bool) error {
	query := `
		UPDATE users
		SET onboarded = $1, updated_at = NOW()
		WHERE id = $2
	`

	args := []any{onboarded, userID}
	_, err := ur.db.Exec(ctx, query, args...)

	return err
}

func (ur *UserRespository) UpdateInteractionsStat(ctx context.Context, userID string) error {
	query := `UPDATE users SET total_interactions = total_interactions + 1, exploration_rate = GREATEST(0.05, 0.4 * exp(-(total_interactions + 1)::float / 50)) WHERE id = $1`
	_, err := ur.db.Exec(ctx, query, userID)

	return err
}
