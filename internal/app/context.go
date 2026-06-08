package app

import (
	"context"
	"net/http"

	"github.com/yaredow/glimpse-api/internal/store/queries"
)

type contextKey string

const userContextKey = contextKey("user")

func (app *application) contextSetUser(r *http.Request, user queries.User) *http.Request {
	ctx := context.WithValue(r.Context(), userContextKey, user)
	return r.WithContext(ctx)
}

func (app *application) contextGetUser(r *http.Request) queries.User {
	user, ok := r.Context().Value(userContextKey).(queries.User)

	if !ok {
		panic("missing user value in request context")
	}

	return user
}
