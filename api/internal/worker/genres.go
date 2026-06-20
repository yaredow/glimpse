package worker

import (
	"context"

	"github.com/yaredow/glimpse-api/internal/store/queries"
)

func (w *Worker) syncGenres(ctx context.Context) {
	w.logger.Info("syncing genres from tmdb")

	resp, err := w.tmdb.GetGenres(ctx)
	if err != nil {
		w.logger.Error("failed to fetch genres from tmdb", "error", err)
		return
	}

	params := make([]queries.UpsertGenreParams, len(resp.Genres))
	for i, g := range resp.Genres {
		params[i] = queries.UpsertGenreParams{
			ID:   int32(g.ID),
			Name: g.Name,
		}
	}

	if err := w.store.SyncGenres(ctx, params); err != nil {
		w.logger.Error("failed to sync genres to database", "error", err)
		return
	}

	w.logger.Info("successfully synced genres from tmdb")
}
