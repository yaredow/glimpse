package main

import (
	"context"
	"log"
	"log/slog"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v5"
	"github.com/yaredow/glimpse-api/internal/auth"
	"github.com/yaredow/glimpse-api/internal/handler"
	"github.com/yaredow/glimpse-api/internal/handler/middleware"
	"github.com/yaredow/glimpse-api/internal/mailer"
	"github.com/yaredow/glimpse-api/internal/repository/postgres"
	"github.com/yaredow/glimpse-api/internal/service"
	"github.com/yaredow/glimpse-api/internal/tmdb"
	"github.com/yaredow/glimpse-api/internal/worker"
)

const (
	defaultTimeout = 30
	defaultAddress = ":4000"
)

func main() {
	// Environment variables
	jwtSecret := os.Getenv("JWT_SECRET")
	smtpHost := os.Getenv("SMTP_HOST")
	smtpUsername := os.Getenv("SMTP_USERNAME")
	smtpPassword := os.Getenv("SMTP_PASSWORD")
	smtpSender := os.Getenv("SMTP_SENDER")

	// Server
	pool, err := pgxpool.New(context.Background(), os.Getenv("DB_DSN"))
	if err != nil {
		log.Fatal("unable to connect to the database", err)
	}
	defer pool.Close()

	// Echo
	e := echo.New()
	e.Use(middleware.CORS)
	timeoutStr := os.Getenv("CONTEXT_TIMEOUT")
	timeout, err := strconv.Atoi(timeoutStr)
	if err != nil {
		log.Println("failed to parse timeout, using default timeout")
		timeout = defaultTimeout
	}
	timeoutContext := time.Duration(timeout) * time.Second
	e.Use(middleware.SetRequestContextWithTimeout(timeoutContext))

	// Repositories
	db := &postgres.DB{Pool: pool}
	userRepo := postgres.NewUserRepository(db)
	tokenRepo := postgres.NewTokenRepository(db)
	refreshTokenRepo := postgres.NewRefreshTokenRepository(db)
	jwtMgr := auth.NewManager([]byte(jwtSecret))

	// TMDB
	tmdbClient := tmdb.NewClient(os.Getenv("TMDB_BEARER_TOKEN"), os.Getenv("TMDB_URL"))
	recRepo := postgres.NewRecommendationRepository(db)

	syncWorker := worker.NewWorker(recRepo, recRepo, nil, nil, tmdbClient, slog.Default())
	syncWorker.Start()
	defer syncWorker.Stop()

	// Mailer
	m := mailer.New(smtpHost, 25, smtpUsername, smtpPassword, smtpSender)

	// Worker pool
	wp := worker.New()

	// Services
	userService := service.NewUserService(userRepo, tokenRepo, refreshTokenRepo)

	// Middleware
	e.Use(middleware.Authenticate(jwtMgr, userService))

	// Handlers
	handler.NewUserHandler(e, userService, jwtMgr, m, wp)

	e.GET("/", func(c *echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"message": "Hello, World!"})
	})

	if err := e.Start(defaultAddress); err != nil {
		e.Logger.Error("failed to start server", "error", err)
	}
}
