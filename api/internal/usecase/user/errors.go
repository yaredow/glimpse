package userusecase

import (
	"errors"

	"github.com/yaredow/glimpse-api/internal/entity"
)

var (
	ErrDuplicateEmail       = entity.BusinessError{Field: "email", Message: "a user with this email address already exists"}
	ErrDuplicateUsername    = entity.BusinessError{Field: "username", Message: "a user with this username already exists"}
	ErrRecordNotFound       = errors.New("no record found")
	ErrEditConflict         = errors.New("edit conflict")
	ErrTokenReuse           = errors.New("token reuse")
	ErrRefreshTokenExpired  = errors.New("refresh token expired")
	ErrInvalidCredentials   = errors.New("invalid credentials")
)
