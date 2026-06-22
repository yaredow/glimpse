package userusecase

import "errors"

var (
	ErrDuplicateEmail    = errors.New("duplicate email")
	ErrDuplicateUsername = errors.New("duplicate username")
	ErrRecordNotFound    = errors.New("no record found")
	ErrEditConflict      = errors.New("edit conflict")
	ErrTokenReuse        = errors.New("token reuse")
)
