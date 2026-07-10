package routes

import (
	"github.com/labstack/echo/v5"
	"github.com/yaredow/glimpse-api/internal/auth"
	"github.com/yaredow/glimpse-api/internal/handler"
	"github.com/yaredow/glimpse-api/internal/handler/middleware"
	"github.com/yaredow/glimpse-api/internal/mailer"
	"github.com/yaredow/glimpse-api/internal/worker"
)

func Register(
	e *echo.Echo,
	userSvc handler.UserService,
	jwtMgr *auth.JWTManager,
	mailer mailer.Mailer,
	workers *worker.Pool,
	prefSvc handler.PreferenceService,
	genreLister handler.GenreLister,
	prefUpserter handler.PreferenceUpserter,
	onboarder handler.Onboarder,
	gridSvc handler.GridService,
	affSeed handler.AffinitySeeder,
) {
	userH := handler.NewUserHandler(userSvc, jwtMgr, mailer, workers)
	e.POST("/v1/users", userH.Create)
	e.POST("/v1/login", userH.Authenticate)
	e.PUT("/v1/users/activates", userH.Activate)
	e.POST("/v1/tokens/password-reset", userH.RequestPasswordReset)
	e.PUT("/v1/users/password", userH.ResetPassword)
	e.POST("/v1/tokens/refresh", userH.RefreshToken)
	e.POST("/v1/tokens/logout", userH.Logout)

	prefH := handler.NewPreferenceHandler(prefSvc)
	e.GET("/v1/me/preferences", prefH.GetPreference, middleware.RequireAuthenticatedUser())
	e.PUT("/v1/me/preferences", prefH.UpsertPreference, middleware.RequireAuthenticatedUser())

	onbH := handler.NewOnboardingHandler(genreLister, prefUpserter, onboarder, affSeed)
	e.POST("/v1/onboarding/start", onbH.Start, middleware.RequireAuthenticatedUser())
	e.POST("/v1/onboarding/finish", onbH.Complete, middleware.RequireAuthenticatedUser())

	recH := handler.NewRecommendationHandler(gridSvc)
	e.GET("/v1/grid", recH.GetGrid, middleware.RequireAuthenticatedUser())
	e.POST("/v1/grid/interactions", recH.RecordInteraction, middleware.RequireAuthenticatedUser())
}
