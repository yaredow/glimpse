package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/go-chi/httplog/v3"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/yaredow/glimpse-api/internal/db"
)

type config struct {
	port int
	env  string
	db   struct {
		dsn         string
		maxConns    int64
		minConns    int64
		maxConnLife time.Duration
		maxIdleTime time.Duration
	}
}

type application struct {
	config    config
	logger    *slog.Logger
	logFormat *httplog.Schema
	queries   *db.Queries
}

func main() {
	_ = godotenv.Load()
	var cfg config

	flag.IntVar(&cfg.port, "port", 4000, "the port to listen on")
	flag.StringVar(&cfg.env, "env", "development", "the environment to run in")
	flag.StringVar(&cfg.db.dsn, "db-dsn", os.Getenv("DB_DSN"), "PostgreSQL connection string")
	flag.Int64Var(&cfg.db.maxConns, "db-max-conns", 25, "Max open DB connections")
	flag.Int64Var(&cfg.db.minConns, "db-min-conns", 5, "Min idle DB connections")
	flag.DurationVar(&cfg.db.maxConnLife, "db-max-conn-lifetime", time.Hour, "Max connection lifetime")
	flag.DurationVar(&cfg.db.maxIdleTime, "db-max-idle-time", 15*time.Minute, "Max connection idle time")
	flag.Parse()

	logFormat := httplog.SchemaECS.Concise(cfg.env == "development")
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	migrateDSN := strings.Replace(cfg.db.dsn, "postgres://", "pgx5://", 1)
	if err := db.RunMigrations(migrateDSN); err != nil {
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

	app := &application{
		config:    cfg,
		logger:    logger,
		logFormat: logFormat,
		queries:   db.New(pool),
	}

	if err := app.serve(); !errors.Is(err, http.ErrServerClosed) {
		logger.Error("server error", "error", err)
		os.Exit(1)
	}
}

func openDB(cfg config) (*pgxpool.Pool, error) {
	poolCfg, err := pgxpool.ParseConfig(cfg.db.dsn)
	if err != nil {
		return nil, fmt.Errorf("parsing db config: %w", err)
	}

	poolCfg.MaxConns = int32(cfg.db.maxConns)
	poolCfg.MinConns = int32(cfg.db.minConns)
	poolCfg.MaxConnLifetime = cfg.db.maxConnLife
	poolCfg.MaxConnIdleTime = cfg.db.maxIdleTime

	pool, err := pgxpool.NewWithConfig(context.Background(), poolCfg)
	if err != nil {
		return nil, fmt.Errorf("creating a connection pool: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("pinging database: %w", err)
	}

	return pool, err
}
