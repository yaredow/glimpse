package worker

import (
	"context"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/yaredow/glimpse-api/internal/store/queries"
	"github.com/yaredow/glimpse-api/internal/tmdb"
)

func parseDate(s string) pgtype.Date {
	var d pgtype.Date
	if s == "" {
		return d
	}

	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return d
	}

	d.Time = t
	d.Valid = true
	return d
}

func floatToNumeric(f float64) pgtype.Numeric {
	var n pgtype.Numeric
	if err := n.Scan(strconv.FormatFloat(f, 'f', -1, 64)); err != nil {
		return n
	}
	return n
}

func toUpsertParams(tm tmdb.Movie) queries.UpsertMovieParams {
	posterPath := pgtype.Text{String: tm.PosterPath, Valid: tm.PosterPath != ""}
	backdropPath := pgtype.Text{String: tm.BackdropPath, Valid: tm.BackdropPath != ""}

	return queries.UpsertMovieParams{
		TmdbID:           int32(tm.ID),
		VagueDescription: tm.Overview,
		Genres:           tmdb.GenreNames(tm.GenreIDs),
		Title:            tm.Title,
		OriginalTitle:    tm.OriginalTitle,
		FullSynopsis:     tm.Overview,
		PosterPath:       posterPath,
		BackdropPath:     backdropPath,
		ReleaseDate:      parseDate(tm.ReleaseDate),
		VoteAverage:      floatToNumeric(tm.VoteAverage),
		VoteCount:        int32(tm.VoteCount),
		OriginalLanguage: tm.OriginalLanguage,
		Popularity:       floatToNumeric(tm.Popularity),
	}
}

func (w *Worker) syncMovies(ctx context.Context) {
	w.logger.Info("syncing popular movies from tmdb")

	resp, err := w.tmdb.GetMovies(ctx, 1)
	if err != nil {
		w.logger.Error("failed to fetch popular movies", "error", err)
		return
	}

	params := make([]queries.UpsertMovieParams, 0, len(resp.Results))
	for _, tm := range resp.Results {
		params = append(params, toUpsertParams(tm))
	}

	err = w.store.ExecTx(ctx, func(q *queries.Queries) error {
		for _, p := range params {
			if _, err = q.UpsertMovie(ctx, p); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		w.logger.Error("failed to sync movies", "error", err)
		return
	}

	w.logger.Info("successfully synced popular movies", "count", len(resp.Results))
}
