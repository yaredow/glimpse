package main

import (
	"flag"
	"log/slog"
	"os"
	"sync"

	"github.com/go-chi/httplog/v3"
)

type config struct {
	port int
	env  string
}

type application struct {
	config    config
	logger    *slog.Logger
	logFormat *httplog.Schema
	wg        sync.WaitGroup
}

func main() {
	var cfg config
	flag.IntVar(&cfg.port, "port", 4000, "server port")
	flag.StringVar(&cfg.env, "env", "development", "Environment (development|staging|production)")
	flag.Parse()

	logFormat := httplog.SchemaECS.Concise(cfg.env == "development")

	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	app := &application{
		config:    cfg,
		logger:    logger,
		logFormat: logFormat,
	}

	if err := app.serve(); err != nil {
		logger.Error("Serve failed", "error", err)
	}
}
