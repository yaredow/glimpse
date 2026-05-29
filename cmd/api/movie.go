package main

import (
	"net/http"
)

func (app *application) getMoviesHandler(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("Hello Cinephile"))
}
