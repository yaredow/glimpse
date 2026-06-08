package store

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/yaredow/glimpse-api/internal/store/queries"
)

var (
	ErrTokenReuse      = errors.New("token reuse")
	ErrRecordNotFound  = errors.New("record not found")
	ErrEditConflict    = errors.New("edit conflict")
	ErrDuplicateEmail  = errors.New("duplicate email")
	ErrDuplicateUsername = errors.New("duplicate username")
)

type Store struct {
	*queries.Queries
	db *pgxpool.Pool
}

func NewStore(db *pgxpool.Pool) *Store {
	return &Store{
		Queries: queries.New(db),
		db:      db,
	}
}

// ExecTx executes a function within a database transaction.
func (s *Store) ExecTx(ctx context.Context, fn func(*queries.Queries) error) error {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return err
	}

	q := s.Queries.WithTx(tx)
	err = fn(q)
	if err != nil {
		if rbErr := tx.Rollback(ctx); rbErr != nil {
			return rbErr
		}
		return err
	}

	return tx.Commit(ctx)
}
