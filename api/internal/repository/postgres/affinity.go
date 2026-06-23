package postgres

import (
	"context"

	"github.com/yaredow/glimpse-api/internal/entity"
	"github.com/yaredow/glimpse-api/internal/sqlc/queries"
)

type AffinityRepo struct {
	db *DB
}

func NewAffinityRepo(db *DB) *AffinityRepo {
	return &AffinityRepo{db: db}
}

func (ar *AffinityRepo) GetByUser(ctx context.Context, userID int64) ([]entity.UserAffinity, error) {
	rows, err := ar.db.q.GetUserAffinities(ctx, userID)
	if err != nil {
		return nil, err
	}
	affs := make([]entity.UserAffinity, len(rows))
	for i, row := range rows {
		affs[i] = entity.UserAffinity{
			UserID:      row.UserID,
			Dimension:   row.Dimension,
			Value:       row.Value,
			Score:       row.Score,
			Confidence:  row.Confidence,
			LastUpdated: row.LastUpdated,
		}
	}
	return affs, nil
}

func (ar *AffinityRepo) Decay(ctx context.Context) error {
	return ar.db.q.DecayAffinies(ctx)
}

func (ar *AffinityRepo) Upsert(ctx context.Context, userID int64, dimension, value string, score float64) error {
	return ar.db.q.UpsertUserAffinity(ctx, queries.UpsertUserAffinityParams{
		UserID:    userID,
		Dimension: dimension,
		Value:     value,
		Score:     score,
	})
}
