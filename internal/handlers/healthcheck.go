package handlers

import "net/http"

func (h *Handlers) HealthcheckHandler(w http.ResponseWriter, r *http.Request) {
	data := map[string]string{
		"status":      "ok",
		"environment": h.Env,
		"version":     version,
	}

	err := h.writeJSON(w, http.StatusOK, envelope{"data": data}, nil)
	if err != nil {
		h.serverErrorResponse(w, r, err)
		return
	}
}
