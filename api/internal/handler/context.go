package handler

import (
	"context"
	"net/http"

	"github.com/yaredow/glimpse-api/internal/entity"
)

type contextKey string

const userContextKey = contextKey("user")

func ContextSetUser(r *http.Request, user *entity.User) *http.Request {
	ctx := context.WithValue(r.Context(), userContextKey, user)
	return r.WithContext(ctx)
}

func ContextGetUser(r *http.Request) *entity.User {
	user, ok := r.Context().Value(userContextKey).(*entity.User)
	if !ok {
		return nil
	}
	return user
}
