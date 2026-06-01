package app

import (
	"fmt"
	"net/http"
	"time"
)

func (app *application) Serve() error {
	srv := http.Server{
		Addr:         fmt.Sprintf(":%d", app.config.Port),
		Handler:      app.routes(),
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	app.logger.Info("server starting", "addr", srv.Addr, "env", app.config.Env)

	return srv.ListenAndServe()
}
