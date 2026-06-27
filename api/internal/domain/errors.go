package domain

import "errors"

// General errors
var (
	ErrInternalServerError = errors.New("internal server error")
	ErrNotFound            = errors.New("your request item not found")
	ErrConflict            = errors.New("your item already exists")
	ErrBadParamInput       = errors.New("given param is not valid")
)

// Validation errors
var (
	ErrNameRequired     = errors.New("name is required")
	ErrInvalidEmail     = errors.New("invalid email format")
	ErrPasswordTooShort = errors.New("password must be at least 8 characters")
)
