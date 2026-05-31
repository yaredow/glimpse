package config

import (
	"flag"
	"os"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Port int
	Env  string
	DB   struct {
		DSN         string
		MaxConns    int64
		MinConns    int64
		MaxConnLife time.Duration
		MaxIdleTime time.Duration
	}
}

func Load() Config {
	_ = godotenv.Load()

	var cfg Config

	flag.IntVar(&cfg.Port, "port", 4000, "the port to listen on")
	flag.StringVar(&cfg.Env, "env", "development", "the environment to run in")
	flag.StringVar(&cfg.DB.DSN, "db-dsn", os.Getenv("DB_DSN"), "PostgreSQL connection string")
	flag.Int64Var(&cfg.DB.MaxConns, "db-max-conns", 25, "Max open DB connections")
	flag.Int64Var(&cfg.DB.MinConns, "db-min-conns", 5, "Min idle DB connections")
	flag.DurationVar(&cfg.DB.MaxConnLife, "db-max-conn-lifetime", time.Hour, "Max connection lifetime")
	flag.DurationVar(&cfg.DB.MaxIdleTime, "db-max-idle-time", 15*time.Minute, "Max connection idle time")
	flag.Parse()

	return cfg
}
