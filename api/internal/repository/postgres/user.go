package postgres

import (
	"context"
	"time"

	"github.com/yaredow/glimpse-api/internal/entity"
	"github.com/yaredow/glimpse-api/internal/store/queries"
)

type UserRepo struct {
	db *DB
}

func NewUserRepo(db *DB) *UserRepo {
	return &UserRepo{db: db}
}

func (ur *UserRepo) Create(ctx context.Context, user *entity.User) error {
	result, err := ur.db.q.CreateUser(ctx, queries.CreateUserParams{
		Username:     user.Username,
		Email:        user.Email,
		PasswordHash: user.PasswordHash,
	})
	if err != nil {
		return mapDuplicateError(err)
	}

	user.ID = result.ID
	user.CreatedAt = result.CreatedAt
	return nil
}

func (ur *UserRepo) GetByID(ctx context.Context, id int64) (*entity.User, error) {
	row, err := ur.db.q.GetUserById(ctx, id)
	if err != nil {
		return nil, mapNotFoundError(err)
	}

	return mapUser(row.ID, row.Username, row.Email, row.PasswordHash,
		row.ShufflesRemaining, row.LastShuffleReset,
		row.ExplorationRate, row.TotalInteractions,
		row.CreatedAt, row.Activated, row.Version), nil
}

func (ur *UserRepo) GetByEmail(ctx context.Context, email string) (*entity.User, error) {
	row, err := ur.db.q.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, mapNotFoundError(err)
	}

	return mapUser(row.ID, row.Username, row.Email, row.PasswordHash,
		row.ShufflesRemaining, row.LastShuffleReset,
		row.ExplorationRate, row.TotalInteractions,
		row.CreatedAt, row.Activated, row.Version), nil
}

func (ur *UserRepo) UpdateInteractionStats(ctx context.Context, userID int64) error {
	return ur.db.q.UpdateUserInteractionStats(ctx, userID)
}

func (ur *UserRepo) Update(ctx context.Context, user *entity.User) error {
	result, err := ur.db.q.UpdateUser(ctx, queries.UpdateUserParams{
		ID:           user.ID,
		Username:     user.Username,
		Email:        user.Email,
		PasswordHash: user.PasswordHash,
		Activated:    user.Activated,
		Version:      user.Version,
	})
	if err != nil {
		return mapEditConflictError(err)
	}

	user.Version = result.Version
	return nil
}

func mapUser(id int64, username, email string, pw entity.Password,
	shuffles int32, lastReset time.Time, exploration float64,
	totalInteractions int32, createdAt time.Time, activated bool, version int32,
) *entity.User {
	return &entity.User{
		ID:                id,
		Username:          username,
		Email:             email,
		PasswordHash:      pw,
		ShufflesRemaining: shuffles,
		LastShuffleReset:  lastReset,
		ExplorationRate:   exploration,
		TotalInteractions: totalInteractions,
		CreatedAt:         createdAt,
		Activated:         activated,
		Version:           version,
	}
}
