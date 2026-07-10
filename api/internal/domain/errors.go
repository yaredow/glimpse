package domain

import "errors"

var (
	ErrInternalServerError = errors.New("internal server error")
	ErrNotFound            = errors.New("your request item not found")
	ErrConflict            = errors.New("your item already exists")
	ErrEditConflict        = errors.New("edit conflict")
	ErrBadParamInput       = errors.New("given param is not valid")
)

var (
	ErrInvalidEmail       = errors.New("invalid email format")
	ErrDuplicateEmail     = errors.New("email already in use")
	ErrNameRequired       = errors.New("name is required")
	ErrPasswordTooShort   = errors.New("password must be at least 8 characters")
	ErrInvalidCredentials = errors.New("invalid email or password")
)

var (
	ErrNotEnoughCandidates  = errors.New("not enough movies matching preferences")
	ErrInvalidAction        = errors.New("invalid action")
	ErrMissingGridSessionID = errors.New("existing grid is missing grid session id")
)
