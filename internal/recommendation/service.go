package recommendation

import (
	"github.com/yaredow/glimpse-api/internal/store"
	"github.com/yaredow/glimpse-api/internal/tmdb"
)

type Service struct {
	store *store.Store
}

func NewService(store *store.Store, tmdb *tmdb.Client) *Service

func (s *Service) generateGrid()
