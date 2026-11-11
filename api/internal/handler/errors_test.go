package handler

import (
	"errors"
	"fmt"
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/yaredow/glimpse-api/internal/domain"
)

func TestGetStatusCode(t *testing.T) {
	tests := []struct {
		name string
		err  error
		want int
	}{
		{name: "nil", err: nil, want: http.StatusOK},
		{name: "not found", err: domain.ErrNotFound, want: http.StatusNotFound},
		{name: "wrapped not found", err: fmt.Errorf("get movie: %w", domain.ErrNotFound), want: http.StatusNotFound},
		{name: "conflict", err: domain.ErrConflict, want: http.StatusConflict},
		{name: "duplicate email", err: domain.ErrDuplicateEmail, want: http.StatusConflict},
		{name: "edit conflict", err: domain.ErrEditConflict, want: http.StatusConflict},
		{name: "no syncs remaining", err: domain.ErrNoSyncsRemaining, want: http.StatusConflict},
		{name: "selection locked", err: domain.ErrSelectionLocked, want: http.StatusConflict},
		{name: "invalid credentials", err: domain.ErrInvalidCredentials, want: http.StatusUnauthorized},
		{name: "account not activated", err: domain.ErrAccountNotActivated, want: http.StatusForbidden},
		{name: "invalid email", err: domain.ErrInvalidEmail, want: http.StatusUnprocessableEntity},
		{name: "name required", err: domain.ErrNameRequired, want: http.StatusUnprocessableEntity},
		{name: "password too short", err: domain.ErrPasswordTooShort, want: http.StatusUnprocessableEntity},
		{name: "bad param input", err: domain.ErrBadParamInput, want: http.StatusUnprocessableEntity},
		{name: "not enough candidates", err: domain.ErrNotEnoughCandidates, want: http.StatusUnprocessableEntity},
		{name: "invalid action", err: domain.ErrInvalidAction, want: http.StatusUnprocessableEntity},
		{name: "missing grid session", err: domain.ErrMissingGridSessionID, want: http.StatusInternalServerError},
		{name: "internal", err: domain.ErrInternalServerError, want: http.StatusInternalServerError},
		{name: "unknown", err: errors.New("boom"), want: http.StatusInternalServerError},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			require.Equal(t, tc.want, getStatusCode(tc.err))
		})
	}
}
