package main

import (
	"context"
	"errors"
	"flag"
	"log/slog"
	"net/http"
	"os"
	"strings"

	"github.com/go-chi/httplog/v3"
	"github.com/joho/godotenv"
	"github.com/yaredow/glimpse-api/internal/app"
	"github.com/yaredow/glimpse-api/internal/auth"
	"github.com/yaredow/glimpse-api/internal/data"
	"github.com/yaredow/glimpse-api/internal/data/tmdb"
	db "github.com/yaredow/glimpse-api/internal/db"
)

type config struct {
	port  int
	env   string
	dbDSN string
	jwt   struct {
		secret string
		issuer string
	}
	tmdb struct {
		apiKey  string
		baseURL string
	}
}

func main() {
	_ = godotenv.Load()
	var cfg config

	flag.IntVar(&cfg.port, "port", 4000, "the port to listen on")
	flag.StringVar(&cfg.env, "env", "development", "the environment to run in")
	flag.StringVar(&cfg.dbDSN, "db-dsn", os.Getenv("DB_DSN"), "PostgreSQL connection string")

	// JWT
	flag.StringVar(&cfg.jwt.secret, "jwt-secret", os.Getenv("JWT_SECRET"), "JWT secret")
	flag.StringVar(&cfg.jwt.issuer, "jwt-issuer", "glimpse.net", "JWT issuer")

	// TMDB API
	flag.StringVar(&cfg.tmdb.apiKey, "tmdb-api-key", os.Getenv("TMDB_API_KEY"), "TMDB API key")
	flag.StringVar(&cfg.tmdb.baseURL, "tmdb-base-url", os.Getenv("TMDB_BASE_URL"), "TMDB base URL")

	logFormat := httplog.SchemaECS.Concise(cfg.env == "development")
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	migrateDSN := strings.Replace(cfg.dbDSN, "postgres://", "pgx5://", 1)
	if err := db.RunMigrations(migrateDSN); err != nil {
		logger.Error("migration failed", "error", err)
		os.Exit(1)
	}

	pool, err := db.OpenDB(context.Background(), cfg.dbDSN)
	if err != nil {
		logger.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer pool.Close()
	logger.Info("database connection pool established")

	store := data.NewStore(pool)
	jwtManager := auth.NewManager([]byte(cfg.jwt.secret), cfg.jwt.issuer)
	tmdbClient := tmdb.NewClient(cfg.tmdb.apiKey, cfg.tmdb.baseURL)

	appCfg := app.Config{
		Port: cfg.port,
		Env:  cfg.env,
	}

	application := app.New(appCfg, logger, logFormat, store, tmdbClient, jwtManager)

	if err := application.Serve(); !errors.Is(err, http.ErrServerClosed) {
		logger.Error("server error", "error", err)
		os.Exit(1)
	}
}
