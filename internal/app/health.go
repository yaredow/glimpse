package app

import (
	"net/http"
)

func (app *application) Healthcheck(w http.ResponseWriter, r *http.Request) {
	data := Envelope{
		"status":  "available",
		"env":     "development",
		"version": version,
	}

	err := app.WriteJSON(w, http.StatusOK, data, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}
}
