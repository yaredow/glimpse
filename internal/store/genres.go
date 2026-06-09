package store

import (
	"context"

	"github.com/yaredow/glimpse-api/internal/store/queries"
)

func (s *Store) SyncGenres(ctx context.Context, genres []queries.UpsertGenreParams) error {
	return s.ExecTx(ctx, func(q *queries.Queries) error {
		for _, g := range genres {
			if err := q.UpsertGenre(ctx, g); err != nil {
				return err
			}
		}

		return nil
	})
}
