package postgres

import (
	"context"

	"github.com/yaredow/glimpse-api/internal/entity"
	"github.com/yaredow/glimpse-api/internal/store/queries"
)

type GenreRepo struct {
	db *DB
}

func NewGenreRepo(db *DB) *GenreRepo {
	return &GenreRepo{db: db}
}

func (gr *GenreRepo) List(ctx context.Context) ([]*entity.Genre, error) {
	rows, err := gr.db.q.ListGenres(ctx)
	if err != nil {
		return nil, err
	}
	genres := make([]*entity.Genre, len(rows))
	for i, row := range rows {
		genres[i] = mapGenre(row)
	}
	return genres, nil
}

func (gr *GenreRepo) Upsert(ctx context.Context, genre *entity.Genre) error {
	return gr.db.q.UpsertGenre(ctx, queries.UpsertGenreParams{
		ID:   genre.ID,
		Name: genre.Name,
	})
}

func (gr *GenreRepo) UpsertBatch(ctx context.Context, genres []*entity.Genre) error {
	return gr.db.ExecTx(ctx, func(q *queries.Queries) error {
		for _, g := range genres {
			if err := q.UpsertGenre(ctx, queries.UpsertGenreParams{
				ID:   g.ID,
				Name: g.Name,
			}); err != nil {
				return err
			}
		}
		return nil
	})
}

func (gr *GenreRepo) GetNamesByIDs(ctx context.Context, ids []int32) ([]string, error) {
	all, err := gr.db.q.ListGenres(ctx)
	if err != nil {
		return nil, err
	}

	idSet := make(map[int32]struct{}, len(ids))
	for _, id := range ids {
		idSet[id] = struct{}{}
	}

	names := make([]string, 0, len(ids))
	for _, g := range all {
		if _, ok := idSet[g.ID]; ok {
			names = append(names, g.Name)
		}
	}
	return names, nil
}

func mapGenre(g queries.Genre) *entity.Genre {
	return &entity.Genre{
		ID:   g.ID,
		Name: g.Name,
	}
}


