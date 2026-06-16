package worker

import (
	"context"
	"strconv"
	"strings"
	"time"
	"unicode"
	"unicode/utf8"

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

func vagueDescription(overview string) string {
	if overview == "" {
		return ""
	}

	runes := []rune(overview)
	maxRunes := 150

	sentenceEnd := -1
	for i, r := range overview {
		if (r == '.' || r == '!' || r == '?') && i+1 < len(overview) {
			next, _ := utf8.DecodeRuneInString(overview[i+1:])
			if next == ' ' || unicode.IsUpper(next) || next == '\n' {
				sentenceEnd = i + 1
				break
			}
		}
	}

	var result string
	if sentenceEnd > 40 && sentenceEnd <= maxRunes {
		result = strings.TrimSpace(overview[:sentenceEnd])
	} else {
		if len(runes) > maxRunes {
			runes = runes[:maxRunes]
		}
		result = strings.TrimSpace(string(runes))
	}

	if result == "" {
		return ""
	}

	last := result[len(result)-1]
	if last != '.' && last != '!' && last != '?' {
		result += "."
	}

	return result
}

func toUpsertParams(tm tmdb.Movie) queries.UpsertMovieParams {
	posterPath := pgtype.Text{String: tm.PosterPath, Valid: tm.PosterPath != ""}
	backdropPath := pgtype.Text{String: tm.BackdropPath, Valid: tm.BackdropPath != ""}

	return queries.UpsertMovieParams{
		TmdbID:           int32(tm.ID),
		VagueDescription: vagueDescription(tm.Overview),
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
	seen := make(map[int]tmdb.Movie)

	// popular movies
	for page := 1; page <= 5; page++ {
		resp, err := w.tmdb.GetPopularMovies(ctx, page)
		if err != nil {
			w.logger.Error("sync movies: get popular movies", "page", page, "error", err)
			continue
		}

		for _, m := range resp.Results {
			seen[m.ID] = m
		}
	}

	// top rated movies
	for page := 1; page <= 5; page++ {
		resp, err := w.tmdb.GetTopRatedMovies(ctx, page)
		if err != nil {
			w.logger.Error("sync movies: get top rated movies", "page", page, "error", err)
			continue
		}

		for _, m := range resp.Results {
			seen[m.ID] = m
		}
	}

	w.logger.Info("syncing movies", "count", len(seen))

	params := make([]queries.UpsertMovieParams, 0, len(seen))
	for _, m := range seen {
		params = append(params, toUpsertParams(m))
	}

	if err := w.store.ExecTx(ctx, func(q *queries.Queries) error {
		for _, p := range params {
			if _, err := q.UpsertMovie(ctx, p); err != nil {
				return err
			}
		}
		return nil
	}); err != nil {
		w.logger.Error("failed to sync movies", "error", err)
		return
	}

	w.logger.Info("successfully synced movies", "count", len(params))
}
