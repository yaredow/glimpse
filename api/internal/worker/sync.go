package worker

import (
	"context"
	"strings"
	"time"
	"unicode"
	"unicode/utf8"

	"github.com/yaredow/glimpse-api/internal/domain"
	"github.com/yaredow/glimpse-api/internal/tmdb"
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

func toDomainMovie(tm tmdb.Movie) *domain.Movie {
	m := &domain.Movie{
		TmdbID:           tm.ID,
		VagueDescription: vagueDescription(tm.Overview),
		Genres:           tmdb.GenreNames(tm.GenreIDs),
		Title:            tm.Title,
		ReleaseDate:      parseDate(tm.ReleaseDate),
		VoteAverage:      tm.VoteAverage,
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
	if tm.VoteCount > 0 {
		m.VoteCount = &tm.VoteCount
	}

	return m
}

func (w *Worker) syncGenres(ctx context.Context) {
	w.logger.Info("syncing genres from tmdb")

	resp, err := w.tmdb.GetGenres(ctx)
	if err != nil {
		w.logger.Error("failed to fetch genres from tmdb", "error", err)
		return
	}

	genres := make([]*domain.Genre, len(resp.Genres))
	for i, g := range resp.Genres {
		genres[i] = &domain.Genre{
			ID:   g.ID,
			Name: g.Name,
		}
	}

	if err := w.genreRepo.UpsertBatchGenres(ctx, genres); err != nil {
		w.logger.Error("failed to sync genres", "error", err)
		return
	}

	w.logger.Info("successfully synced genres", "count", len(genres))
}

func (w *Worker) syncMovies(ctx context.Context) {
	seen := make(map[int]tmdb.Movie)

	for page := 1; page <= 25; page++ {
		resp, err := w.tmdb.GetPopularMovies(ctx, page)
		if err != nil {
			w.logger.Error("sync movies: get popular", "page", page, "error", err)
			continue
		}

		for _, m := range resp.Results {
			seen[m.ID] = m
		}
	}

	for page := 1; page <= 25; page++ {
		resp, err := w.tmdb.GetTopRatedMovies(ctx, page)
		if err != nil {
			w.logger.Error("sync movies: get top rated", "page", page, "error", err)
			continue
		}

		for _, m := range resp.Results {
			seen[m.ID] = m
		}
	}

	w.logger.Info("syncing movies", "count", len(seen))

	movies := make([]*domain.Movie, 0, len(seen))
	for _, m := range seen {
		movies = append(movies, toDomainMovie(m))
	}

	if err := w.movieRepo.UpsertBatchMovies(ctx, movies); err != nil {
		w.logger.Error("failed to sync movies", "error", err)
		return
	}

	w.logger.Info("successfully synced movies", "count", len(movies))
}
