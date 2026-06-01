package app

import (
	"log/slog"

	"github.com/go-chi/httplog/v3"
	"github.com/yaredow/glimpse-api/internal/data/queries"
)

type Config struct {
	Port int
	Env  string
}

type application struct {
	config    Config
	logger    *slog.Logger
	logFormat *httplog.Schema
	queries   *queries.Queries
}

var version = "1.0.0"

func New(cfg Config, logger *slog.Logger, logFormat *httplog.Schema, q *queries.Queries) *application {
	return &application{
		config:    cfg,
		logger:    logger,
		logFormat: logFormat,
		queries:   q,
	}
}
