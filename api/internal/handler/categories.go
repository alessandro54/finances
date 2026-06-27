package handler

import (
	"encoding/json"
	"net/http"
	"strings"


	"finances-api/internal/model"
)

func (h *Handler) listCategories(w http.ResponseWriter, r *http.Request) {
	names := []string{}
	err := h.DB.NewSelect().Model((*model.Category)(nil)).
		Column("name").Order("name").Scan(r.Context(), &names)
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
	if err := json.NewDecoder(r.Body).Decode(&b); err != nil {
		badRequest(w, "invalid body")
		return
	}
	name := strings.TrimSpace(b.Name)
	if name == "" {
		badRequest(w, "category name is empty")
		return
	}
	res, err := h.DB.NewInsert().Model(&model.Category{Name: name}).Ignore().Exec(r.Context())
	if err != nil {
		fail(w, err)
		return
	}
	h.Hub.Broadcast(`{"source":"api"}`)
	n, _ := res.RowsAffected()
	writeJSON(w, http.StatusOK, map[string]any{"created": n})
}

// deleteCategory removes a category; transactions using it are set to NULL so they
// fall under "Others" rather than dangling on a name that's no longer selectable.
func (h *Handler) deleteCategory(w http.ResponseWriter, r *http.Request) {
	name := pathParam(r, "name")
	ctx := r.Context()
	cleared, err := h.DB.NewUpdate().Model((*model.Transaction)(nil)).
		Set("category = NULL").Where("category = ?", name).Exec(ctx)
	if err != nil {
		fail(w, err)
		return
	}
	deleted, err := h.DB.NewDelete().Model((*model.Category)(nil)).
		Where("name = ?", name).Exec(ctx)
	if err != nil {
		fail(w, err)
		return
	}
	c, _ := cleared.RowsAffected()
	d, _ := deleted.RowsAffected()
	h.Hub.Broadcast(`{"source":"api"}`)
	writeJSON(w, http.StatusOK, map[string]any{"deleted": d, "transactions_cleared": c})
}
