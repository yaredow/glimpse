package postgres

import (
	"context"

	"github.com/google/uuid"
	"github.com/yaredow/glimpse-api/internal/store/queries"
	recusecase "github.com/yaredow/glimpse-api/internal/usecase/recommendation"
)

type GridRepo struct {
	db *DB
}

func NewGridRepo(db *DB) *GridRepo {
	return &GridRepo{db: db}
}

func (gr *GridRepo) GetUserGrid(ctx context.Context, userID int64) ([]recusecase.GridSlot, error) {
	rows, err := gr.db.q.GetUserGrid(ctx, userID)
	if err != nil {
		return nil, err
	}
	s := make([]recusecase.GridSlot, len(rows))
	for i, row := range rows {
		s[i] = recusecase.GridSlot{
			MovieID:          row.MovieID,
			TmdbID:           row.TmdbID,
			SlotNumber:       row.SlotNumber,
			IsRevealed:       row.IsRevealed,
			VagueDescription: row.VagueDescription,
			Genres:           row.Genres,
			GridSessionID:    row.GridSessionID,
		}
	}
	return s, nil
}

func (gr *GridRepo) Clear(ctx context.Context, userID int64) error {
	return gr.db.q.ClearUserGrid(ctx, userID)
}

func (gr *GridRepo) InsertSlot(ctx context.Context, userID int64, movieID int64, slotNumber int32, sessionID uuid.UUID) error {
	return gr.db.q.InsertGridSlot(ctx, queries.InsertGridSlotParams{
		UserID:        userID,
		MovieID:       movieID,
		SlotNumber:    slotNumber,
		GridSessionID: sessionID,
	})
}

type GridHistoryRepo struct {
	db *DB
}

func NewGridHistoryRepo(db *DB) *GridHistoryRepo {
	return &GridHistoryRepo{db: db}
}

func (ghr *GridHistoryRepo) GetRecentlyShown(ctx context.Context, userID int64, limit int32) ([]recusecase.GridHistoryEntry, error) {
	rows, err := ghr.db.q.GetRecentlyShownMovies(ctx, queries.GetRecentlyShownMoviesParams{
		UserID: userID,
		Limit:  limit,
	})
	if err != nil {
		return nil, err
	}
	entries := make([]recusecase.GridHistoryEntry, len(rows))
	for i, row := range rows {
		entries[i] = recusecase.GridHistoryEntry{
			MovieID: row.MovieID,
			ShownAt: row.ShownAt,
		}
	}
	return entries, nil
}

func (ghr *GridHistoryRepo) CleanupOld(ctx context.Context) error {
	return ghr.db.q.CleanupOldGridHistory(ctx)
}

func (ghr *GridHistoryRepo) Insert(ctx context.Context, userID int64, movieID int64) error {
	return ghr.db.q.InsertGridHistory(ctx, queries.InsertGridHistoryParams{
		UserID:  userID,
		MovieID: movieID,
	})
}
