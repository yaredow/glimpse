package app

import (
	"context"
	"fmt"
	"net/http"

	"github.com/yaredow/glimpse-api/internal/store/queries"
)

func (app *application) listGenresHandler(w http.ResponseWriter, r *http.Request) {
	genres, err := app.store.ListGenres(r.Context())
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	err = app.writeJSON(w, http.StatusOK, Envelope{"genres": genres}, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}

func (app *application) SyncGenres(ctx context.Context) error {
	resp, err := app.tmdb.GetGenres(ctx)
	if err != nil {
		return fmt.Errorf("sync genres: fetch from tmdb: %w", err)
	}

	params := make([]queries.UpsertGenreParams, len(resp.Genres))
	for i, g := range resp.Genres {
		params[i] = queries.UpsertGenreParams{
			ID:   int32(g.ID),
			Name: g.Name,
		}
	}

	if err := app.store.SyncGenres(ctx, params); err != nil {
		return fmt.Errorf("sync genres: store update: %w", err)
	}

	app.logger.Info("successfully synced genres from tmdb")
	return nil
}
