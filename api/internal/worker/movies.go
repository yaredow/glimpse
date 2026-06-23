package worker

import (
	"context"
	"strings"
	"time"
	"unicode"
	"unicode/utf8"

	"github.com/yaredow/glimpse-api/internal/entity"
	"github.com/yaredow/glimpse-api/internal/repository/tmdb"
)

func parseDate(s string) time.Time {
	if s == "" {
		return time.Time{}
	}

	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return time.Time{}
	}

	return t
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

func toMovieEntity(tm tmdb.Movie) *entity.Movie {
	m := &entity.Movie{
		TmdbID:           int32(tm.ID),
		VagueDescription: vagueDescription(tm.Overview),
		Genres:           tmdb.GenreNames(tm.GenreIDs),
		Title:            tm.Title,
		ReleaseDate:      parseDate(tm.ReleaseDate),
		VoteAverage:      tm.VoteAverage,
		VoteCount:        int32(tm.VoteCount),
		OriginalLanguage: tm.OriginalLanguage,
		Popularity:       tm.Popularity,
	}

	if tm.OriginalTitle != "" {
		m.OriginalTitle = &tm.OriginalTitle
	}
	if tm.Overview != "" {
		m.FullSynopsis = &tm.Overview
	}
	if tm.PosterPath != "" {
		m.PosterPath = &tm.PosterPath
	}
	if tm.BackdropPath != "" {
		m.BackdropPath = &tm.BackdropPath
	}

	return m
}

func (w *Worker) syncMovies(ctx context.Context) {
	seen := make(map[int]tmdb.Movie)

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

	movies := make([]*entity.Movie, 0, len(seen))
	for _, m := range seen {
		movies = append(movies, toMovieEntity(m))
	}

	if err := w.movieRepo.UpsertBatch(ctx, movies); err != nil {
		w.logger.Error("failed to sync movies", "error", err)
		return
	}

	w.logger.Info("successfully synced movies", "count", len(movies))
}
