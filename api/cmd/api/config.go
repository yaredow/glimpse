package main

import (
	"errors"
	"flag"
	"fmt"
	"os"
	"time"
)

type Config struct {
	Port            int
	Env             string
	DatabaseURL     string
	JWTSecret       string
	JWTIssuer       string
	TMDBAPIKey      string
	TMDBBaseURL     string
	SMTPHost        string
	SMTPPort        int
	SMTPUsername    string
	SMTPPassword    string
	SMTPSender      string
	ShutdownTimeout time.Duration
}

func LoadConfig() (Config, error) {
	var cfg Config

	flag.IntVar(&cfg.Port, "port", 4000, "API server port")
	flag.StringVar(&cfg.Env, "env", "development", "Environment (development|staging|production)")
	flag.StringVar(&cfg.DatabaseURL, "db-dsn", os.Getenv("DB_DSN"), "PostgreSQL connection string")
	flag.StringVar(&cfg.JWTSecret, "jwt-secret", os.Getenv("JWT_SECRET"), "JWT signing secret (min 32 bytes)")
	flag.StringVar(&cfg.JWTIssuer, "jwt-issuer", getEnv("JWT_ISSUER", "glimpse.net"), "JWT issuer")
	flag.StringVar(&cfg.TMDBAPIKey, "tmdb-api-key", os.Getenv("TMDB_API_KEY"), "TMDB API key")
	flag.StringVar(&cfg.TMDBBaseURL, "tmdb-base-url", getEnv("TMDB_BASE_URL", "https://api.themoviedb.org/3"), "TMDB base URL")
	flag.StringVar(&cfg.SMTPHost, "smtp-host", os.Getenv("SMTP_HOST"), "SMTP host")
	flag.IntVar(&cfg.SMTPPort, "smtp-port", 2525, "SMTP port")
	flag.StringVar(&cfg.SMTPUsername, "smtp-username", os.Getenv("SMTP_USERNAME"), "SMTP username")
	flag.StringVar(&cfg.SMTPPassword, "smtp-password", os.Getenv("SMTP_PASSWORD"), "SMTP password")
	flag.StringVar(&cfg.SMTPSender, "smtp-sender", getEnv("SMTP_SENDER", "noreply@glimpse.net"), "SMTP sender address")
	flag.DurationVar(&cfg.ShutdownTimeout, "shutdown-timeout", 30*time.Second, "Graceful shutdown timeout")

	flag.Parse()

	if err := cfg.Validate(); err != nil {
		return Config{}, fmt.Errorf("config: %w", err)
	}

	return cfg, nil
}

func (c Config) Validate() error {
	switch {
	case c.Port < 1 || c.Port > 65535:
		return errors.New("port must be between 1 and 65535")
	case c.Env != "development" && c.Env != "staging" && c.Env != "production":
		return errors.New("env must be one of: development, staging, production")
	case c.DatabaseURL == "":
		return errors.New("db-dsn is required")
	case len(c.JWTSecret) < 32:
		return errors.New("jwt-secret must be at least 32 bytes")
	case c.JWTIssuer == "":
		return errors.New("jwt-issuer is required")
	}
	return nil
}

func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok {
		return v
	}
	return fallback
}
