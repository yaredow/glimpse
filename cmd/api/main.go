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
	"github.com/yaredow/glimpse-api/internal/data/queries"
	db "github.com/yaredow/glimpse-api/internal/db"
)

type config struct {
	port  int
	env   string
	dbDSN string
}

func main() {
	_ = godotenv.Load()
	var cfg config

	flag.IntVar(&cfg.port, "port", 4000, "the port to listen on")
	flag.StringVar(&cfg.env, "env", "development", "the environment to run in")
	flag.StringVar(&cfg.dbDSN, "db-dsn", os.Getenv("DB_DSN"), "PostgreSQL connection string")
	flag.Parse()

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

	q := queries.New(pool)

	appCfg := app.Config{
		Port: cfg.port,
		Env:  cfg.env,
	}

	application := app.New(appCfg, logger, logFormat, q)

	if err := application.Serve(); !errors.Is(err, http.ErrServerClosed) {
		logger.Error("server error", "error", err)
		os.Exit(1)
	}
}
