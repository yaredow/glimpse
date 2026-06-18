package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"strings"

	"github.com/go-chi/httplog/v3"
	"github.com/joho/godotenv"
	"github.com/yaredow/glimpse-api/internal/app"
	"github.com/yaredow/glimpse-api/internal/auth"
	db "github.com/yaredow/glimpse-api/internal/db"
	"github.com/yaredow/glimpse-api/internal/mailer"
	"github.com/yaredow/glimpse-api/internal/recommendation"
	"github.com/yaredow/glimpse-api/internal/store"
	"github.com/yaredow/glimpse-api/internal/tmdb"
	"github.com/yaredow/glimpse-api/internal/worker"
)

func main() {
	_ = godotenv.Load()

	cfg, err := app.LoadConfig()
	if err != nil {
		slog.New(slog.NewJSONHandler(os.Stderr, nil)).Error("failed to load config", "error", err)
		os.Exit(1)
	}

	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	logFormat := httplog.SchemaECS.Concise(cfg.Env == "development")

	migrateDSN := strings.Replace(cfg.DatabaseURL, "postgres://", "pgx5://", 1)
	if err = db.RunMigrations(migrateDSN); err != nil {
		logger.Error("migration failed", "error", err)
		os.Exit(1)
	}

	pool, err := db.OpenDB(context.Background(), cfg.DatabaseURL)
	if err != nil {
		logger.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer pool.Close()
	logger.Info("database connection pool established")

	store := store.NewStore(pool)
	jwtManager := auth.NewManager([]byte(cfg.JWTSecret), cfg.JWTIssuer)
	tmdbClient := tmdb.NewClient(cfg.TMDBAPIKey, cfg.TMDBBaseURL)
	mailer := mailer.New(cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPUsername, cfg.SMTPPassword, cfg.SMTPSender)
	recService := recommendation.NewService(store, tmdb.GenreNames)

	w := worker.New(store, tmdbClient, logger)
	w.Start()
	defer w.Stop()

	application := app.New(cfg, logger, logFormat, store, tmdbClient, mailer, jwtManager, recService)

	if err := application.Serve(); !errors.Is(err, http.ErrServerClosed) {
		logger.Error("server error", "error", err)
		os.Exit(1)
	}
}
