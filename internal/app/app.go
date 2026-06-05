package app

import (
	"log/slog"
	"sync"

	"github.com/go-chi/httplog/v3"
	"github.com/yaredow/glimpse-api/internal/auth"
	"github.com/yaredow/glimpse-api/internal/data"
	"github.com/yaredow/glimpse-api/internal/tmdb"
)

type application struct {
	config    Config
	logger    *slog.Logger
	logFormat *httplog.Schema
	store     *data.Store
	tmdb      *tmdb.Client
	jwt       *auth.JWTManager
	wg        sync.WaitGroup
}

var version = "1.0.0"

func New(cfg Config, logger *slog.Logger, logFormat *httplog.Schema, store *data.Store, tmdb *tmdb.Client, jwt *auth.JWTManager) *application {
	return &application{
		config:    cfg,
		logger:    logger,
		logFormat: logFormat,
		store:     store,
		tmdb:      tmdb,
		jwt:       jwt,
	}
}
