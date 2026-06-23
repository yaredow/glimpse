// packate postgres
package postgres

import (
	"errors"
	"strings"

	"github.com/jackc/pgx"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/yaredow/glimpse-api/internal/store/queries"
	userusecase "github.com/yaredow/glimpse-api/internal/usecase/user"
)

type DB struct {
	q *queries.Queries
}

func NewDB(pool *pgxpool.Pool) *DB {
	return &DB{
		q: queries.New(pool),
	}
}

func mapDuplicateError(err error) error {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		switch {
		case strings.Contains(pgErr.Message, "user_email_key"):
			return userusecase.ErrDuplicateEmail
		case strings.Contains(pgErr.Message, "users_username_key"):
			return userusecase.ErrDuplicateUsername

		}
	}
	return err
}

func mapNotFoundError(err error) error {
	if errors.Is(err, pgx.ErrNoRows) {
		return userusecase.ErrRecordNotFound
	}
	return err
}

func mapEditConflictError(err error) error {
	if errors.Is(err, pgx.ErrNoRows) {
		return userusecase.ErrEditConflict
	}
	return err
}
