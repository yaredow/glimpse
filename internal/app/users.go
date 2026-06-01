package app

import (
	"net/http"

	"github.com/yaredow/glimpse-api/internal/data/queries"
)

func (app *application) CreateUser(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Name  string `json:"name"`
		Email string `json:"email"`
	}

	err := app.ReadJSON(w, r, &input)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	user, err := app.queries.CreateUser(r.Context(), queries.CreateUserParams{
		Email: input.Email,
		Name:  input.Name,
	})
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	err = app.WriteJSON(w, http.StatusCreated, Envelope{"user": user}, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}
