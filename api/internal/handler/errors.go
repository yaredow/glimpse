package handler

import (
	"errors"
	"net/http"

	"github.com/sirupsen/logrus"
	"github.com/yaredow/glimpse-api/internal/domain"
)

func getStatusCode(err error) int {
	if err == nil {
		return http.StatusOK
	}

	logrus.Error(err)

	switch {
	case errors.Is(err, domain.ErrInternalServerError):
		return http.StatusInternalServerError
	case errors.Is(err, domain.ErrNotFound):
		return http.StatusNotFound
	case errors.Is(err, domain.ErrConflict),
		errors.Is(err, domain.ErrDuplicateEmail),
		errors.Is(err, domain.ErrEditConflict),
		errors.Is(err, domain.ErrNoSyncsRemaining),
		errors.Is(err, domain.ErrSelectionLocked),
		errors.Is(err, domain.ErrMovieAlreadyResolved):
		return http.StatusConflict
	case errors.Is(err, domain.ErrInvalidCredentials):
		return http.StatusUnauthorized
	case errors.Is(err, domain.ErrAccountNotActivated):
		return http.StatusForbidden
	case errors.Is(err, domain.ErrInvalidEmail),
		errors.Is(err, domain.ErrNameRequired),
		errors.Is(err, domain.ErrPasswordTooShort),
		errors.Is(err, domain.ErrBadParamInput),
		errors.Is(err, domain.ErrNotEnoughCandidates),
		errors.Is(err, domain.ErrInvalidAction):
		return http.StatusUnprocessableEntity
	case errors.Is(err, domain.ErrMissingGridSessionID):
		return http.StatusInternalServerError
	default:
		return http.StatusInternalServerError
	}
}
