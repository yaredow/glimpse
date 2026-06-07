package app

import (
	"errors"
	"net/http"
	"time"

	"github.com/yaredow/glimpse-api/internal/auth"
	"github.com/yaredow/glimpse-api/internal/store"
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

	store.ValidateEmail(v, input.Email)
	store.ValidatePasswordPlainText(v, input.Password)

	if !v.Valid() {
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	user, err := app.store.GetUserByEmail(r.Context(), input.Email)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	match, err := user.PasswordHash.Matches(input.Password)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	if !match {
		app.invalidCredentialsResponse(w, r)
		return
	}

	accessToken, err := app.jwt.GenerateJWTToken(user.ID)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	refreshToken, err := app.store.CreateNewToken(r.Context(), user.ID, 7*24*time.Hour, store.ScopeRefreshToken)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	err = app.writeJSON(w, http.StatusCreated, Envelope{"access_token": accessToken, "refresh_token": refreshToken}, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}

func (app *application) refreshTokenHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		RefreshTokenPlainText string `json:"refresh_token"`
	}

	err := app.ReadJSON(w, r, &input)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	v := validator.New()
	store.ValidateToken(v, input.RefreshTokenPlainText, "refresh_token")
	if !v.Valid() {
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	newRefreshToken, err := app.store.RotateRefreshToken(r.Context(), input.RefreshTokenPlainText, 7*24*time.Hour)
	if err != nil {
		switch {
		case errors.Is(err, store.ErrTokenReuse), errors.Is(err, auth.ErrExpiredToken):
			app.invalidAuthenticationTokenResponse(w, r)
		default:
			app.serverErrorResponse(w, r, err)
		}
		return
	}

	accessToken, err := app.jwt.GenerateJWTToken(newRefreshToken.UserID)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	err = app.writeJSON(w, http.StatusOK, Envelope{
		"access_token":  accessToken,
		"refresh_token": newRefreshToken.PlainText,
	}, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}

func (app *application) revokeTokenHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		RefreshTokenPlainText string `json:"refresh_token"`
	}

	err := app.ReadJSON(w, r, &input)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	v := validator.New()
	store.ValidateToken(v, input.RefreshTokenPlainText, "refresh_token")
	if !v.Valid() {
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	_, err = app.store.GetRefreshTokenByPlainText(r.Context(), input.RefreshTokenPlainText)
	if err != nil {
		switch {
		case errors.Is(err, store.ErrRecordNotFound):
			app.invalidAuthenticationTokenResponse(w, r)
		default:
			app.serverErrorResponse(w, r, err)
		}
		return
	}

	err = app.store.RevokeRefreshTokenByHash(r.Context(), input.RefreshTokenPlainText)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	env := Envelope{"message": "refresh token revoked"}

	err = app.writeJSON(w, http.StatusOK, env, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}
}
