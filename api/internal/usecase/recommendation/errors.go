package recusecase

import "errors"

var (
	ErrNotEnoughCandidates  = errors.New("not enough movies matching preferences")
	ErrInvalidAction        = errors.New("invalid action")
	ErrMissingGridSessionID = errors.New("existing grid is missing grid session id")
	ErrRecordNotFound       = errors.New("resource not found")
)
