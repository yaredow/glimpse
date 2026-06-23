// packate postgres
package postgres

import (
	"context"
	"errors"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/yaredow/glimpse-api/internal/sqlc/queries"
	recusecase "github.com/yaredow/glimpse-api/internal/usecase/recommendation"
	userusecase "github.com/yaredow/glimpse-api/internal/usecase/user"
)

type DB struct {
	q    *queries.Queries
	pool *pgxpool.Pool
}

func NewDB(pool *pgxpool.Pool) *DB {
	return &DB{
		q:    queries.New(pool),
		pool: pool,
	}
}

func (db *DB) ExecTx(ctx context.Context, fn func(*queries.Queries) error) error {
	tx, err := db.pool.Begin(ctx)
	if err != nil {
		return err
	}

	q := db.q.WithTx(tx)
	err = fn(q)
	if err != nil {
		if rbErr := tx.Rollback(ctx); rbErr != nil {
			return rbErr
		}
		return err
	}

	return tx.Commit(ctx)
}

func (db *DB) RunInTx(ctx context.Context, fn func(recusecase.RepositoryProvider) error) error {
	return db.ExecTx(ctx, func(q *queries.Queries) error {
		txDB := &DB{q: q, pool: db.pool}
		return fn(&txRepos{
			movie:       NewMovieRepo(txDB),
			affinity:    NewAffinityRepo(txDB),
			interaction: NewInteractionRepo(txDB),
			grid:        NewGridRepo(txDB),
			gridHistory: NewGridHistoryRepo(txDB),
			user:        NewUserRepo(txDB),
		})
	})
}

type txRepos struct {
	movie       *MovieRepo
	affinity    *AffinityRepo
	interaction *InteractionRepo
	grid        *GridRepo
	gridHistory *GridHistoryRepo
	user        *UserRepo
}

func (r *txRepos) Movie() recusecase.MovieRepository          { return r.movie }
func (r *txRepos) Affinity() recusecase.AffinityRepository     { return r.affinity }
func (r *txRepos) Interaction() recusecase.InteractionRepository { return r.interaction }
func (r *txRepos) Grid() recusecase.GridRepository              { return r.grid }
func (r *txRepos) GridHistory() recusecase.GridHistoryRepository { return r.gridHistory }
func (r *txRepos) User() recusecase.UserRepository               { return r.user }

func mapDuplicateError(err error) error {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		switch {
		case strings.Contains(pgErr.Message, "users_email_key"):
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
