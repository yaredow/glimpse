package main

import (
	"context"
	"log/slog"
	"os"
	"strings"

	"github.com/go-chi/httplog/v3"
	"github.com/joho/godotenv"
	"github.com/yaredow/glimpse-api/internal/auth"
	"github.com/yaredow/glimpse-api/internal/db"
	"github.com/yaredow/glimpse-api/internal/handler"
	interactionhandler "github.com/yaredow/glimpse-api/internal/handler/interaction"
	"github.com/yaredow/glimpse-api/internal/handler/middleware"
	moviehandler "github.com/yaredow/glimpse-api/internal/handler/movie"
	preferencehandler "github.com/yaredow/glimpse-api/internal/handler/preference"
	userhandler "github.com/yaredow/glimpse-api/internal/handler/user"
	"github.com/yaredow/glimpse-api/internal/mailer"
	"github.com/yaredow/glimpse-api/internal/repository/postgres"
	"github.com/yaredow/glimpse-api/internal/repository/tmdb"
	recusecase "github.com/yaredow/glimpse-api/internal/usecase/recommendation"
	userusecase "github.com/yaredow/glimpse-api/internal/usecase/user"
	"github.com/yaredow/glimpse-api/internal/worker"
)

func main() {
	_ = godotenv.Load()

	cfg, err := LoadConfig()
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

	jwtManager := auth.NewManager([]byte(cfg.JWTSecret), cfg.JWTIssuer)
	tmdbClient := tmdb.NewClient(cfg.TMDBAPIKey, cfg.TMDBBaseURL)
	mailer := mailer.New(cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPUsername, cfg.SMTPPassword, cfg.SMTPSender)

	pgdb := postgres.NewDB(pool)
	userRepo := postgres.NewUserRepo(pgdb)
	tokenRepo := postgres.NewTokenRepo(pgdb)
	baseHandler := handler.NewBase(logger)
	userUC := userusecase.NewUserUsecase(userRepo, tokenRepo, jwtManager, mailer)
	userHandler := userhandler.New(baseHandler, userUC)
	authMiddleware := middleware.NewAuth(jwtManager, userRepo, baseHandler)

	movieRepo := postgres.NewMovieRepo(pgdb)
	affinityRepo := postgres.NewAffinityRepo(pgdb)
	interactionRepo := postgres.NewInteractionRepo(pgdb)
	gridRepo := postgres.NewGridRepo(pgdb)
	gridHistoryRepo := postgres.NewGridHistoryRepo(pgdb)
	genreRepo := postgres.NewGenreRepo(pgdb)
	preferenceRepo := postgres.NewPreferenceRepo(pgdb)

	recUC := recusecase.New(movieRepo, affinityRepo, interactionRepo, gridRepo, gridHistoryRepo, userRepo, genreRepo, preferenceRepo, pgdb)

	movieHandler := moviehandler.New(baseHandler, recUC)
	interactionHandler := interactionhandler.New(baseHandler, recUC)
	preferenceHandler := preferencehandler.New(baseHandler, recUC)

	w := worker.New(genreRepo, movieRepo, affinityRepo, gridHistoryRepo, tmdbClient, logger)
	w.Start()
	defer w.Stop()

	r := handler.NewRouter(logger, logFormat, handler.Routes{
		Authenticate:          authMiddleware.Authenticate,
		RequireAuthenticatedUser: authMiddleware.RequireAuthenticatedUser,
		Register:              userHandler.Register,
		Activate:              userHandler.Activate,
		UpdatePassword:        userHandler.UpdateUserPassword,
		Login:                 userHandler.Login,
		Refresh:               userHandler.RefreshToken,
		Revoke:                userHandler.RevokeToken,
		CreateActivation:      userHandler.CreateActivationToken,
		CreatePasswordReset:   userHandler.CreatePasswordResetToken,
		GetTodayGrid:          movieHandler.GetTodayGrid,
		RecordInteraction:     interactionHandler.RecordInteraction,
		StartOnboarding:       preferenceHandler.StartOnboarding,
		FinishOnboarding:      preferenceHandler.FinishOnboarding,
		GetPreferences:        preferenceHandler.GetPreferences,
		UpdatePreferences:     preferenceHandler.UpdatePreferences,
	})

	if err := serve(cfg, logger, r); err != nil {
		logger.Error("server error", "error", err)
		os.Exit(1)
	}
}
