package app

import (
	"net/http"

	"github.com/yaredow/glimpse-api/internal/data"
	"github.com/yaredow/glimpse-api/internal/validator"
)

func (app *application) createAuthenticationTokenHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	err := app.ReadJSON(w, r, &input)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	v := validator.New()

	data.ValidateEmail(v, input.Email)
	data.ValidatePasswordPlainText(v, input.Password)

	if !v.Valid() {
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	user, err := app.queries.GetUserByEmail(r.Context(), input.Email)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	u := data.User{}
	u.Password.Hash = user.PasswordHash

	match, err := u.Password.Matches(input.Password)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	if !match {
		app.invalidCredentialsResponse(w, r)
		return
	}

	err = app.writeJSON(w, http.StatusOK, Envelope{"message": "success"}, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}
