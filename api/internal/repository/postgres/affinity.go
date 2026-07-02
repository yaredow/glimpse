package postgres

import (
	"context"

	"github.com/yaredow/glimpse-api/internal/domain"
)

type AffinityRepository struct {
	db *DB
}

func NewAffinityRepository(db *DB) *AffinityRepository {
	return &AffinityRepository{db: db}
}

func (ar *AffinityRepository) GetByUserID(ctx context.Context, userID int64) ([]*domain.Affinity, error) {
	query := `SELECT user_id, dimension, value, score, confidence, last_updated FROM user_affinities WHERE user_id = $1`

	rows, err := ar.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var affinities []*domain.Affinity
	for rows.Next() {
		var a domain.Affinity
		if err := rows.Scan(&a.UserID, &a.Dimension, &a.Value, &a.Score, &a.Confidence, &a.LastUpdated); err != nil {
			return nil, err
		}
		affinities = append(affinities, &a)
	}

	return affinities, rows.Err()
}

func (ar *AffinityRepository) Upsert(ctx context.Context, userID int64, dimension, value string, delta float64) error {
	query := `INSERT INTO user_affinities (user_id, dimension, value, score) VALUES ($1, $2, $3, $4)
		ON CONFLICT (user_id, dimension, value) DO UPDATE SET score = user_affinities.score + $4, confidence = user_affinities.confidence + 0.1, last_updated = NOW()`

	args := []any{userID, dimension, value, delta}
	_, err := ar.db.Exec(ctx, query, args...)

	return err
}
