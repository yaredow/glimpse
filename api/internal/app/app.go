package app

import (
	"log/slog"
	"sync"

	"github.com/go-chi/httplog/v3"
	"github.com/yaredow/glimpse-api/internal/auth"
	userhandler "github.com/yaredow/glimpse-api/internal/handler/user"
	"github.com/yaredow/glimpse-api/internal/mailer"
	"github.com/yaredow/glimpse-api/internal/recommendation"
	"github.com/yaredow/glimpse-api/internal/store"
	"github.com/yaredow/glimpse-api/internal/tmdb"
)

var version = "1.0.0"

type application struct {
	config      Config
	logger      *slog.Logger
	logFormat   *httplog.Schema
	store       *store.Store
	tmdb        *tmdb.Client
	mailer      *mailer.Mailer
	jwt         *auth.JWTManager
	wg          sync.WaitGroup
	recService  *recommendation.Service
	userHandler *userhandler.Handler
}

func New(cfg Config, logger *slog.Logger, logFormat *httplog.Schema, store *store.Store, tmdb *tmdb.Client, mailer *mailer.Mailer, jwt *auth.JWTManager, recService *recommendation.Service, userHandler *userhandler.Handler) *application {
	return &application{
		config:      cfg,
		logger:      logger,
		logFormat:   logFormat,
		store:       store,
		tmdb:        tmdb,
		mailer:      mailer,
		jwt:         jwt,
		recService:  recService,
		userHandler: userHandler,
	}
}
