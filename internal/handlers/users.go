package handlers

import (
	"context"
	"net/http"

	"github.com/yaredow/glimpse-api/internal/data/queries"
)

func (h *Handlers) CreateUserHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email string `json:"email"`
		Name  string `json:"name"`
	}

	err := h.readJSON(w, r, &input)
	if err != nil {
		h.badRequestResponse(w, r, err)
		return
	}

	user, err := h.Queries.CreateUser(context.Background(), queries.CreateUserParams{
		Name:  input.Email,
		Email: input.Email,
	})
	if err != nil {
		h.serverErrorResponse(w, r, err)
		return
	}

	err = h.writeJSON(w, http.StatusCreated, envelope{"user": user}, nil)
	if err != nil {
		h.serverErrorResponse(w, r, err)
		return
	}
}
