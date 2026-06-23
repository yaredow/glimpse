package recusecase

import (
	"context"

	"github.com/google/uuid"
	"github.com/yaredow/glimpse-api/internal/entity"
)

type MovieRepository interface {
	GetByID(ctx context.Context, id int64) (*entity.Movie, error)
	GetCandidateMovies(ctx context.Context, userID int64, limit int32) ([]*entity.Movie, error)
	UpdateWatchCounts(ctx context.Context, movieID int64, shown bool, watched bool) error
	UpsertBatch(ctx context.Context, movies []*entity.Movie) error
}

type UserRepository interface {
	GetByID(ctx context.Context, id int64) (*entity.User, error)
	UpdateInteractionStats(ctx context.Context, userID int64) error
}

type AffinityRepository interface {
	GetByUser(ctx context.Context, userID int64) ([]entity.UserAffinity, error)
	Upsert(ctx context.Context, userID int64, dimension, value string, score float64) error
	Decay(ctx context.Context) error
}

type GridRepository interface {
	GetUserGrid(ctx context.Context, userID int64) ([]GridSlot, error)
	Clear(ctx context.Context, userID int64) error
	InsertSlot(ctx context.Context, userID int64, movieID int64, slotNumber int32, sessionID uuid.UUID) error
}

type GridHistoryRepository interface {
	GetRecentlyShown(ctx context.Context, userID int64, limit int32) ([]GridHistoryEntry, error)
	Insert(ctx context.Context, userID int64, movieID int64) error
	CleanupOld(ctx context.Context) error
}

type InteractionRepository interface {
	Insert(ctx context.Context, interaction *entity.Interaction) error
}

type PreferenceRepository interface {
	GetByUser(ctx context.Context, userID int64) (*entity.Preference, error)
	Upsert(ctx context.Context, userID int64, input UpsertPreferenceInput, onboarded bool) (*entity.Preference, error)
	Update(ctx context.Context, userID int64, input UpsertPreferenceInput) (*entity.Preference, error)
}

type GenreRepository interface {
	List(ctx context.Context) ([]*entity.Genre, error)
	GetNamesByIDs(ctx context.Context, ids []int32) ([]string, error)
}

type RepositoryProvider interface {
	Movie() MovieRepository
	Affinity() AffinityRepository
	Interaction() InteractionRepository
	Grid() GridRepository
	GridHistory() GridHistoryRepository
	User() UserRepository
}

type TransactionManager interface {
	RunInTx(ctx context.Context, fn func(RepositoryProvider) error) error
}
