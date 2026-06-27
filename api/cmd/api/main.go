package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v5"
	"github.com/labstack/echo/v5/middleware"
	"github.com/yaredow/glimpse-api/internal/handler"
	"github.com/yaredow/glimpse-api/internal/repository/postgres"
	"github.com/yaredow/glimpse-api/internal/service"
)

func main() {
	// Server
	pool, err := pgxpool.New(context.Background(), os.Getenv("DB_DSN"))
	if err != nil {
		log.Fatal("unable to connect to the database", err)
	}
	defer pool.Close()

	// Echo
	e := echo.New()
	e.Use(middleware.RequestLogger())
	e.Use(middleware.Recover())

	// Repositories
	userRepo := postgres.NewUserRepository(pool)

	// Services
	userService := service.NewUserService(userRepo)

	// Handlers
	handler.NewUserHandler(e, userService)

	e.GET("/", func(c *echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"message": "Hello, World!"})
	})

	if err := e.Start(":4000"); err != nil {
		e.Logger.Error("failed to start server", "error", err)
	}
}
