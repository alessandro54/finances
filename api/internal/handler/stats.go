package handler

import "net/http"

func (h *Handler) stats(w http.ResponseWriter, r *http.Request) {
	s, err := h.Svc.Stats(r.Context(), r.URL.Query().Get("month"))
	if err != nil {
		fail(w, err)
		return
	}
	writeJSON(w, http.StatusOK, s)
}
