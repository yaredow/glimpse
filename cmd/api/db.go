package main

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	appconfig "github.com/yaredow/glimpse-api/internal/config"
)

func openDB(cfg appconfig.Config) (*pgxpool.Pool, error) {
	poolCfg, err := pgxpool.ParseConfig(cfg.DB.DSN)
	if err != nil {
		return nil, fmt.Errorf("parsing db config: %w", err)
	}

	poolCfg.MaxConns = int32(cfg.DB.MaxConns)
	poolCfg.MinConns = int32(cfg.DB.MinConns)
	poolCfg.MaxConnLifetime = cfg.DB.MaxConnLife
	poolCfg.MaxConnIdleTime = cfg.DB.MaxIdleTime

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

	return pool, nil
}
