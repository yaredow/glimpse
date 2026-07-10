package postgres

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/yaredow/glimpse-api/internal/domain"
)

type GridHistoryRepository struct {
	db *DB
}

func NewGridHistoryRepository(db *DB) *GridHistoryRepository {
	return &GridHistoryRepository{db: db}
}

func (ghr *GridHistoryRepository) WithTx(tx pgx.Tx) *GridHistoryRepository {
	return &GridHistoryRepository{db: &DB{Pool: txPool{tx}}}
}

func (ghr *GridHistoryRepository) GetRecent(ctx context.Context, userID int64, limit int) ([]domain.GridHistoryEntry, error) {
	query := `SELECT movie_id, shown_at FROM user_grid_history WHERE user_id = $1 ORDER BY shown_at DESC LIMIT $2`

	rows, err := ghr.db.Query(ctx, query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []domain.GridHistoryEntry
	for rows.Next() {
		var e domain.GridHistoryEntry
		if err := rows.Scan(&e.MovieID, &e.ShownAt); err != nil {
			return nil, err
		}
		entries = append(entries, e)
	}

	return entries, rows.Err()
}

func (ghr *GridHistoryRepository) Insert(ctx context.Context, userID int64, movieID int64) error {
	query := `INSERT INTO user_grid_history (user_id, movie_id) VALUES ($1, $2)`
	_, err := ghr.db.Exec(ctx, query, userID, movieID)

	return err
}

func (ghr *GridHistoryRepository) CleanupOld(ctx context.Context) error {
	query := `DELETE FROM user_grid_history WHERE shown_at < NOW() - INTERVAL '30 days'`
	_, err := ghr.db.Exec(ctx, query)

	return err
}
