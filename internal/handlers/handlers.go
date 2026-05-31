package handlers

import (
	"log/slog"

	queries "github.com/yaredow/glimpse-api/internal/data/queries"
)

var version = "1.0."

type Handlers struct {
	Logger  *slog.Logger
	Queries *queries.Queries
	Env     string
}

func New(logger *slog.Logger, q *queries.Queries, env string) *Handlers {
	return &Handlers{
		Logger:  logger,
		Queries: q,
		Env:     env,
	}
}
