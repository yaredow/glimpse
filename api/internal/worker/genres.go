package worker

import (
	"context"

	"github.com/yaredow/glimpse-api/internal/entity"
)

func (w *Worker) syncGenres(ctx context.Context) {
	w.logger.Info("syncing genres from tmdb")

	resp, err := w.tmdb.GetGenres(ctx)
	if err != nil {
		w.logger.Error("failed to fetch genres from tmdb", "error", err)
		return
	}

	genres := make([]*entity.Genre, len(resp.Genres))
	for i, g := range resp.Genres {
		genres[i] = &entity.Genre{
			ID:   int32(g.ID),
			Name: g.Name,
		}
	}

	if err := w.genreRepo.UpsertBatch(ctx, genres); err != nil {
		w.logger.Error("failed to sync genres to database", "error", err)
		return
	}

	w.logger.Info("successfully synced genres from tmdb")
}
