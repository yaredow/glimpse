package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/yaredow/glimpse-api/internal/entity"
	"github.com/yaredow/glimpse-api/internal/sqlc/queries"
	movieusecase "github.com/yaredow/glimpse-api/internal/usecase/movie"
)

type MovieRepo struct {
	db *DB
}

func NewMovieRepo(db *DB) *MovieRepo {
	return &MovieRepo{db: db}
}

func (mr *MovieRepo) GetByID(ctx context.Context, id int64) (*entity.Movie, error) {
	m, err := mr.db.q.GetMovieByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, movieusecase.ErrMovieNotFound
		}
		return nil, err
	}
	return mapMovie(m), nil
}

func (mr *MovieRepo) GetByTmdbID(ctx context.Context, tmdbID int32) (*entity.Movie, error) {
	m, err := mr.db.q.GetMovieByTMDBID(ctx, tmdbID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, movieusecase.ErrMovieNotFound
		}
		return nil, err
	}
	return mapMovie(m), nil
}

func (mr *MovieRepo) Upsert(ctx context.Context, movie *entity.Movie) error {
	_, err := mr.db.q.UpsertMovie(ctx, upsertMovieParams(movie))
	return err
}

func (mr *MovieRepo) GetFilteredMovies(ctx context.Context, userID int64, input movieusecase.MovieFilterInput, limit int32) ([]*entity.Movie, error) {
	rows, err := mr.db.q.GetFilteredMovies(ctx, queries.GetFilteredMoviesParams{
		FavoriteGenres: input.FavoriteGenres,
		ExcludedGenres: input.ExcludedGenres,
		Languages:      input.Languages,
		MinRating:      input.MinRating,
		MinYear:        input.MinYear,
		MaxYear:        input.MaxYear,
		UserID:         userID,
		Limit:          limit,
	})
	if err != nil {
		return nil, err
	}
	movies := make([]*entity.Movie, len(rows))
	for i, row := range rows {
		movies[i] = mapMovie(row)
	}
	return movies, nil
}

func (mr *MovieRepo) GetCandidateMovies(ctx context.Context, userID int64, limit int32) ([]*entity.Movie, error) {
	rows, err := mr.db.q.GetCandidateMovies(ctx, queries.GetCandidateMoviesParams{
		UserID: userID,
		Limit:  limit,
	})
	if err != nil {
		return nil, err
	}
	movies := make([]*entity.Movie, len(rows))
	for i, row := range rows {
		movies[i] = mapMovie(row)
	}
	return movies, nil
}

func (mr *MovieRepo) GetMoviesByGenre(ctx context.Context, genres []string, limit int32) ([]*entity.Movie, error) {
	rows, err := mr.db.q.GetMoviesByGenre(ctx, queries.GetMoviesByGenreParams{
		Genres: genres,
		Limit:  limit,
	})
	if err != nil {
		return nil, err
	}
	movies := make([]*entity.Movie, len(rows))
	for i, row := range rows {
		movies[i] = mapMovie(row)
	}
	return movies, nil
}

func (mr *MovieRepo) UpsertBatch(ctx context.Context, movies []*entity.Movie) error {
	return mr.db.ExecTx(ctx, func(q *queries.Queries) error {
		for _, m := range movies {
			if _, err := q.UpsertMovie(ctx, upsertMovieParams(m)); err != nil {
				return err
			}
		}
		return nil
	})
}

func (mr *MovieRepo) UpdateWatchCounts(ctx context.Context, movieID int64, shown bool, watched bool) error {
	return mr.db.q.UpdateMovieWatchCounts(ctx, queries.UpdateMovieWatchCountsParams{
		ID:      movieID,
		Shown:   shown,
		Watched: watched,
	})
}

func mapMovie(m queries.Movie) *entity.Movie {
	return &entity.Movie{
		ID:                  m.ID,
		TmdbID:              m.TmdbID,
		ImdbID:              textPtr(m.ImdbID),
		VagueDescription:    m.VagueDescription,
		Genres:              m.Genres,
		Title:               m.Title,
		OriginalTitle:       textPtr(m.OriginalTitle),
		FullSynopsis:        textPtr(m.FullSynopsis),
		PosterPath:          textPtr(m.PosterPath),
		BackdropPath:        textPtr(m.BackdropPath),
		ReleaseDate:         m.ReleaseDate,
		Runtime:             int4Ptr(m.Runtime),
		VoteAverage:         m.VoteAverage,
		VoteCount:           m.VoteCount.Int32,
		OriginalLanguage:    m.OriginalLanguage,
		Popularity:          m.Popularity,
		CreatedAt:           m.CreatedAt,
		ShownCount:          m.ShownCount,
		WatchedCount:        m.WatchedCount,
		GlobalWatchRate:     float8Ptr(m.GlobalWatchRate),
		Tagline:             textPtr(m.Tagline),
		Director:            textPtr(m.Director),
		CastMembers:         m.CastMembers,
		TrailerKey:          textPtr(m.TrailerKey),
		SpokenLanguages:     m.SpokenLanguages,
		ProductionCountries: m.ProductionCountries,
		DetailSyncedAt:      timestamptzPtr(m.DetailSyncedAt),
	}
}

func upsertMovieParams(m *entity.Movie) queries.UpsertMovieParams {
	return queries.UpsertMovieParams{
		TmdbID:           m.TmdbID,
		ImdbID:           ptrText(m.ImdbID),
		VagueDescription: m.VagueDescription,
		Genres:           m.Genres,
		Title:            m.Title,
		OriginalTitle:    ptrText(m.OriginalTitle),
		FullSynopsis:     ptrText(m.FullSynopsis),
		PosterPath:       ptrText(m.PosterPath),
		BackdropPath:     ptrText(m.BackdropPath),
		ReleaseDate:      m.ReleaseDate,
		Runtime:          ptrInt4(m.Runtime),
		VoteAverage:      m.VoteAverage,
		VoteCount:        ptrInt4(&m.VoteCount),
		OriginalLanguage: m.OriginalLanguage,
		Popularity:       m.Popularity,
	}
}

func textPtr(t pgtype.Text) *string {
	if !t.Valid {
		return nil
	}
	return &t.String
}

func int4Ptr(i pgtype.Int4) *int32 {
	if !i.Valid {
		return nil
	}
	return &i.Int32
}

func float8Ptr(f pgtype.Float8) *float64 {
	if !f.Valid {
		return nil
	}
	return &f.Float64
}

func timestamptzPtr(ts pgtype.Timestamptz) *time.Time {
	if !ts.Valid {
		return nil
	}
	return &ts.Time
}

func ptrText(s *string) pgtype.Text {
	if s == nil {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: *s, Valid: true}
}

func ptrInt4(i *int32) pgtype.Int4 {
	if i == nil {
		return pgtype.Int4{Valid: false}
	}
	return pgtype.Int4{Int32: *i, Valid: true}
}
