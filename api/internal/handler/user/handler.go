package userhandler

import (
	"errors"
	"net/http"

	"github.com/yaredow/glimpse-api/internal/entity"
	"github.com/yaredow/glimpse-api/internal/handler"
	userusecase "github.com/yaredow/glimpse-api/internal/usecase/user"
)

type registerRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type activateRequest struct {
	Token string `json:"token"`
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
		h.mapRegisterError(w, r, err)
		return
	}

	err = h.WriteJSON(w, http.StatusCreated, handler.Envelope{"user": user}, nil)
	if err != nil {
		h.ServerError(w, r, err)
	}
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

func (h *Handler) mapRegisterError(w http.ResponseWriter, r *http.Request, err error) {
	switch {
	case errors.Is(err, entity.ErrUsernameRequired),
		errors.Is(err, entity.ErrUsernameTooLong):
		h.ValidationFailed(w, r, map[string]string{"username": err.Error()})
	case errors.Is(err, entity.ErrEmailRequired),
		errors.Is(err, entity.ErrInvalidEmail):
		h.ValidationFailed(w, r, map[string]string{"email": err.Error()})
	case errors.Is(err, entity.ErrPasswordRequired),
		errors.Is(err, entity.ErrPasswordTooShort),
		errors.Is(err, entity.ErrPasswordTooLong):
		h.ValidationFailed(w, r, map[string]string{"password": err.Error()})
	case errors.Is(err, userusecase.ErrDuplicateEmail):
		h.ValidationFailed(w, r, map[string]string{"email": "a user with this email address already exists"})
	case errors.Is(err, userusecase.ErrDuplicateUsername):
		h.ValidationFailed(w, r, map[string]string{"username": "a user with this username already exists"})
	default:
		h.ServerError(w, r, err)
	}
}
