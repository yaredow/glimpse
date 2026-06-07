package app

import (
	"net/http"

	"github.com/yaredow/glimpse-api/internal/store"
	"github.com/yaredow/glimpse-api/internal/store/queries"
	"github.com/yaredow/glimpse-api/internal/types"
	"github.com/yaredow/glimpse-api/internal/validator"
)

func (app *application) userRegistrationHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	err := app.ReadJSON(w, r, &input)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// 1. Validate Input
	v := validator.New()
	store.ValidateUser(v, input.Username, input.Email)
	store.ValidatePasswordPlainText(v, input.Password)

	if !v.Valid() {
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	// 2. Hash Password
	var password types.Password

	err = password.Set(input.Password)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	// 3. Create User (Using Store and generated Queries)
	result, err := app.store.CreateUser(r.Context(), queries.CreateUserParams{
		Username:     input.Username,
		Email:        input.Email,
		PasswordHash: password,
	})
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	err = app.writeJSON(w, http.StatusCreated, Envelope{"user": result}, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}
