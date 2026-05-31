package main

import (
	"net/http"

	"github.com/yaredow/glimpse-api/internal/db"
)

func (app *application) createUserHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email string `json:"email"`
		Name  string `json:"name"`
	}

	if err := app.readJSON(w, r, &input); err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	user, err := app.queries.CreateUser(r.Context(), db.CreateUserParams{
		Email: input.Email,
		Name:  input.Name,
	})
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	err = app.writeJSON(w, http.StatusCreated, envelope{"user": user}, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}
}
