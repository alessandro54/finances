package handler

import (
	"errors"
	"net/http"

	"finances-api/internal/service"
)

func (h *Handler) listCategories(w http.ResponseWriter, r *http.Request) {
	names, err := h.Svc.ListCategories(r.Context())
	if err != nil {
		fail(w, err)
		return
	}
	writeJSON(w, http.StatusOK, names)
}

func (h *Handler) createCategory(w http.ResponseWriter, r *http.Request) {
	var b struct {
		Name string `json:"name"`
	}
	if !bind(w, r, &b) {
		return
	}
	n, err := h.Svc.CreateCategory(r.Context(), b.Name)
	if errors.Is(err, service.ErrEmptyName) {
		badRequest(w, "category name is empty")
		return
	}
	if err != nil {
		fail(w, err)
		return
	}
	h.Hub.Broadcast(`{"source":"api"}`)
	writeJSON(w, http.StatusOK, map[string]any{"created": n})
}

func (h *Handler) deleteCategory(w http.ResponseWriter, r *http.Request) {
	deleted, cleared, err := h.Svc.DeleteCategory(r.Context(), pathParam(r, "name"))
	if err != nil {
		fail(w, err)
		return
	}
	h.Hub.Broadcast(`{"source":"api"}`)
	writeJSON(w, http.StatusOK, map[string]any{"deleted": deleted, "transactions_cleared": cleared})
}
