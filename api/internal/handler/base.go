// Package handler is the user handler package.
package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/yaredow/glimpse-api/internal/entity"
)

type Envelope map[string]any

type Base struct {
	Logger *slog.Logger
}

func NewBase(logger *slog.Logger) Base {
	return Base{Logger: logger}
}

func (b *Base) ReadJSON(w http.ResponseWriter, r *http.Request, dst any) error {
	maxBytes := 1_048_576
	r.Body = http.MaxBytesReader(w, r.Body, int64(maxBytes))

	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()

	err := dec.Decode(dst)
	if err != nil {
		var syntaxError *json.SyntaxError
		var unmarshalTypeError *json.UnmarshalTypeError
		var invalidUnmarshalError *json.InvalidUnmarshalError
		var maxBytesError *http.MaxBytesError

		switch {
		case errors.As(err, &syntaxError):
			return fmt.Errorf("body contains badly-formed JSON (at character %d)", syntaxError.Offset)

		case errors.As(err, &unmarshalTypeError):
			if unmarshalTypeError.Field != "" {
				return fmt.Errorf("body contains incorrect JSON type for field %q", unmarshalTypeError.Field)
			}
			return fmt.Errorf("body contains incorrect JSON type (at character %d)", unmarshalTypeError.Offset)

		case errors.Is(err, io.EOF):
			return errors.New("body must not be empty")

		case strings.HasPrefix(err.Error(), "json: unknown field"):
			fieldName := strings.TrimPrefix(err.Error(), "json: unknown field ")
			return fmt.Errorf("body contains unknown field %s", fieldName)

		case errors.As(err, &maxBytesError):
			return fmt.Errorf("body must not be larger than %d bytes", maxBytes)

		case errors.As(err, &invalidUnmarshalError):
			panic(err)

		default:
			return err
		}
	}

	err = dec.Decode(&struct{}{})
	if err != io.EOF {
		return errors.New("body must only contain a single JSON value")
	}

	return nil
}

func (b *Base) writeJSON(w http.ResponseWriter, status int, data Envelope, headers http.Header) error {
	js, err := json.MarshalIndent(data, "", "\t")
	if err != nil {
		return err
	}
	js = append(js, '\n')

	for key, value := range headers {
		w.Header()[key] = value
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	_, err = w.Write(js)
	return err
}

func (b *Base) readIDParam(r *http.Request) (int64, error) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		return 0, errors.New("invalid id parameter")
	}

	return id, nil
}

func (b *Base) logError(r *http.Request, err error) {
	b.Logger.Error(
		err.Error(),
		"request_method", r.Method,
		"request_url", r.URL.String(),
	)
}

func (b *Base) errorResponse(w http.ResponseWriter, r *http.Request, status int, message any) {
	env := Envelope{"error": message}

	err := b.writeJSON(w, status, env, nil)
	if err != nil {
		b.logError(r, err)
		w.WriteHeader(500)
	}
}

func (b *Base) serverErrorResponse(w http.ResponseWriter, r *http.Request, err error) {
	b.logError(r, err)
	message := "The server encountered a problem and could not process your request"
	b.errorResponse(w, r, http.StatusInternalServerError, message)
}

func (b *Base) notFoundResponse(w http.ResponseWriter, r *http.Request) {
	message := "The requested resource could not be found"
	b.errorResponse(w, r, http.StatusNotFound, message)
}

func (b *Base) methodNotAllowedResponse(w http.ResponseWriter, r *http.Request) {
	message := fmt.Sprintf("The %s method is not supported for this resource", r.Method)
	b.errorResponse(w, r, http.StatusMethodNotAllowed, message)
}

func (b *Base) badRequestResponse(w http.ResponseWriter, r *http.Request, err error) {
	b.errorResponse(w, r, http.StatusBadRequest, err.Error())
}

func (b *Base) failedValidationResponse(w http.ResponseWriter, r *http.Request, errors map[string]string) {
	b.errorResponse(w, r, http.StatusUnprocessableEntity, errors)
}

func (b *Base) editConflictResponse(w http.ResponseWriter, r *http.Request) {
	message := "unable to update the record due to an edit conflict, please try again"
	b.errorResponse(w, r, http.StatusConflict, message)
}

func (b *Base) rateLimitExceededResponse(w http.ResponseWriter, r *http.Request) {
	message := "rate limit exceeded"
	b.errorResponse(w, r, http.StatusTooManyRequests, message)
}

func (b *Base) invalidCredentialsResponse(w http.ResponseWriter, r *http.Request) {
	message := "invalid credentials"
	b.errorResponse(w, r, http.StatusUnauthorized, message)
}

func (b *Base) invalidAuthenticationTokenResponse(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("WWW-Authenticate", "Bearer")

	message := "invalid or missing authentication token"
	b.errorResponse(w, r, http.StatusUnauthorized, message)
}

func (b *Base) authenticationRequiredResponse(w http.ResponseWriter, r *http.Request) {
	message := "you must be authenticated to access this resource"
	b.errorResponse(w, r, http.StatusUnauthorized, message)
}

func (b *Base) inactiveAccountResponse(w http.ResponseWriter, r *http.Request) {
	message := "your user account must be activated to access this resource"
	b.errorResponse(w, r, http.StatusForbidden, message)
}

func (b *Base) notPermittedResponse(w http.ResponseWriter, r *http.Request) {
	message := "your user account does not have permission to access this resource"
	b.errorResponse(w, r, http.StatusForbidden, message)
}

func (b *Base) ServerError(w http.ResponseWriter, r *http.Request, err error) {
	b.serverErrorResponse(w, r, err)
}

func (b *Base) BadRequest(w http.ResponseWriter, r *http.Request, err error) {
	b.badRequestResponse(w, r, err)
}

func (b *Base) ValidationFailed(w http.ResponseWriter, r *http.Request, errors map[string]string) {
	b.failedValidationResponse(w, r, errors)
}

func (b *Base) NotFound(w http.ResponseWriter, r *http.Request) {
	b.notFoundResponse(w, r)
}

func (b *Base) EditConflict(w http.ResponseWriter, r *http.Request) {
	b.editConflictResponse(w, r)
}

func (b *Base) InvalidCredentials(w http.ResponseWriter, r *http.Request) {
	b.invalidCredentialsResponse(w, r)
}

func (b *Base) InactiveAccount(w http.ResponseWriter, r *http.Request) {
	b.inactiveAccountResponse(w, r)
}

func (b *Base) WriteJSON(w http.ResponseWriter, status int, data Envelope, headers http.Header) error {
	return b.writeJSON(w, status, data, headers)
}

func (b *Base) HandleError(w http.ResponseWriter, r *http.Request, err error) bool {
	var valErr entity.ValidationError
	if errors.As(err, &valErr) {
		b.ValidationFailed(w, r, map[string]string{valErr.Field: valErr.Message})
		return true
	}

	var bizErr entity.BusinessError
	if errors.As(err, &bizErr) {
		b.ValidationFailed(w, r, map[string]string{bizErr.Field: bizErr.Message})
		return true
	}

	return false
}
