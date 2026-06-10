package worker

import (
	"context"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/yaredow/glimpse-api/internal/store/queries"
	"github.com/yaredow/glimpse-api/internal/tmdb"
)

var genreIDToName = map[int]string{
	28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
	80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
	14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
	9648: "Mystery", 10749: "Romance", 878: "Science Fiction",
	10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
}

func genreNames(ids []int) []string {
	names := make([]string, 0, len(ids))
	for _, id := range ids {
		if name, ok := genreIDToName[id]; ok {
			names = append(names, name)
		}
	}
	return names
}

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
		Genres:           genreNames(tm.GenreIDs),
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
