package main

import (
	"errors"
	"log/slog"
	"net/http"
	"os"
	"strings"

	"github.com/go-chi/httplog/v3"

	appconfig "github.com/yaredow/glimpse-api/internal/config"
	data "github.com/yaredow/glimpse-api/internal/data"
	queries "github.com/yaredow/glimpse-api/internal/data/queries"
	"github.com/yaredow/glimpse-api/internal/handlers"
)

type application struct {
	config    appconfig.Config
	logger    *slog.Logger
	logFormat *httplog.Schema
	handlers  *handlers.Handlers
}

func main() {
	cfg := appconfig.Load()

	logFormat := httplog.SchemaECS.Concise(cfg.Env == "development")
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	migrateDSN := strings.Replace(cfg.DB.DSN, "postgres://", "pgx5://", 1)
	if err := data.RunMigrations(migrateDSN); err != nil {
		logger.Error("migration failed", "error", err)
		os.Exit(1)
	}

	pool, err := openDB(cfg)
	if err != nil {
		logger.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer pool.Close()
	logger.Info("database connection pool established")

	q := queries.New(pool)
	h := handlers.New(logger, q, cfg.Env)

	app := &application{
		config:    cfg,
		logger:    logger,
		logFormat: logFormat,
		handlers:  h,
	}

	if err := app.serve(); !errors.Is(err, http.ErrServerClosed) {
		logger.Error("server error", "error", err)
		os.Exit(1)
	}
}
