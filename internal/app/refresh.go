package app

import (
	"errors"
	"net/http"
	"time"

	"github.com/yaredow/glimpse-api/internal/auth"
	"github.com/yaredow/glimpse-api/internal/data"
	"github.com/yaredow/glimpse-api/internal/validator"
)

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
	data.ValidateRefreshToken(v, input.RefreshTokenPlainText)
	if !v.Valid() {
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	newRefreshToken, userID, err := app.store.RotateRefreshToken(r.Context(), input.RefreshTokenPlainText, 7*24*time.Hour)
	if err != nil {
		switch {
		case errors.Is(err, data.ErrTokenReuse), errors.Is(err, auth.ErrExpiredToken):
			app.invalidAuthenticationTokenResponse(w, r)
		default:
			app.serverErrorResponse(w, r, err)
		}
		return
	}

	accessToken, err := app.jwt.GenerateJWTToken(userID)
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
	data.ValidateRefreshToken(v, input.RefreshTokenPlainText)
	if !v.Valid() {
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	_, err = app.store.GetRefreshTokenByPlainText(r.Context(), input.RefreshTokenPlainText)
	if err != nil {
		switch {
		case errors.Is(err, data.ErrRecordNotFound):
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
