package domain

import "errors"

// General errors
var (
	ErrInternalServerError = errors.New("internal server error")
	ErrNotFound            = errors.New("your request item not found")
	ErrConflict            = errors.New("your item already exists")
	ErrEditConflict        = errors.New("edit conflict")
	ErrBadParamInput       = errors.New("given param is not valid")
)

// Validation errors
var (
	ErrNameRequired     = errors.New("name is required")
	ErrInvalidEmail     = errors.New("invalid email format")
	ErrDuplicateEmail   = errors.New("email already in use")
	ErrPasswordTooShort = errors.New("password must be at least 8 characters")
)
