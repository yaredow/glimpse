package worker

import (
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
