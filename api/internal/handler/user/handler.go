// Package userhandler is the user handler package.
package userhandler

import (
	"errors"
	"net/http"

	"github.com/yaredow/glimpse-api/internal/handler"
	userusecase "github.com/yaredow/glimpse-api/internal/usecase/user"
)

var (
	errInvalidToken  = errors.New("invalid or expired token")
	errPasswordReset = errors.New("invalid or expired password reset token")
)

type registerRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type activateRequest struct {
	Token string `json:"token"`
}

type passwordResetRequest struct {
	Password string `json:"password"`
	Token    string `json:"token"`
}

type Handler struct {
	handler.Base
	uc *userusecase.UserUsecase
}

func New(base handler.Base, uc *userusecase.UserUsecase) *Handler {
	return &Handler{
		Base: base,
		uc:   uc,
	}
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := h.ReadJSON(w, r, &req); err != nil {
		h.BadRequest(w, r, err)
		return
	}

	user, err := h.uc.Register(r.Context(), userusecase.RegisterInput{
		Username: req.Username,
		Email:    req.Email,
		Password: req.Password,
	})
	if err != nil {
		if h.HandleError(w, r, err) {
			return
		}
		h.ServerError(w, r, err)
		return
	}

	h.WriteJSON(w, http.StatusCreated, handler.Envelope{"user": user}, nil)
}

func (h *Handler) Activate(w http.ResponseWriter, r *http.Request) {
	var req activateRequest
	if err := h.ReadJSON(w, r, &req); err != nil {
		h.BadRequest(w, r, err)
		return
	}

	err := h.uc.Activate(r.Context(), req.Token)
	if err != nil {
		switch {
		case errors.Is(err, userusecase.ErrRecordNotFound):
			h.ValidationFailed(w, r, map[string]string{"token": "invalid or expired activation token"})
		default:
			h.ServerError(w, r, err)
		}
		return
	}

	err = h.WriteJSON(w, http.StatusOK, handler.Envelope{"message": "account activated successfully"}, nil)
	if err != nil {
		h.ServerError(w, r, err)
	}
}

func (h *Handler) UpdateUserPassword(w http.ResponseWriter, r *http.Request) {
	var req passwordResetRequest
	if err := h.ReadJSON(w, r, &req); err != nil {
		h.BadRequest(w, r, err)
		return
	}

	err := h.uc.ResetPassword(r.Context(), req.Token, req.Password)
	if err != nil {
		if h.HandleError(w, r, err) {
			return
		}
		switch {
		case errors.Is(err, userusecase.ErrRecordNotFound):
			h.ValidationFailed(w, r, map[string]string{"token": errPasswordReset.Error()})
		default:
			h.ServerError(w, r, err)
		}
		return
	}

	err = h.WriteJSON(w, http.StatusOK, handler.Envelope{"message": "password update successfully"}, nil)
	if err != nil {
		h.ServerError(w, r, err)
		return
	}
}
