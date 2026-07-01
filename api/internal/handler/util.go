package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"net/url"
	"strconv"

	"github.com/go-chi/chi/v5"
)

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

// bind decodes the JSON request body into dst. On failure it writes a 400 and
// returns false, so handlers stay one line: `if !bind(w, r, &b) { return }`.
func bind(w http.ResponseWriter, r *http.Request, dst any) bool {
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		badRequest(w, "invalid body")
		return false
	}
	return true
}

func fail(w http.ResponseWriter, err error) {
	log.Printf("error: %v", err)
	http.Error(w, "error: "+err.Error(), http.StatusInternalServerError)
}

func badRequest(w http.ResponseWriter, msg string) {
	http.Error(w, msg, http.StatusBadRequest)
}

// pathParam reads a URL path param and percent-decodes it. chi does not decode
// %XX in path segments, but dedupe_ids/categories contain ':' etc. that the web
// sends via encodeURIComponent — so decode here to match stored values.
func pathParam(r *http.Request, key string) string {
	v := chi.URLParam(r, key)
	if dec, err := url.PathUnescape(v); err == nil {
		return dec
	}
	return v
}

func parseInt(s string, def int) int {
	if s == "" {
		return def
	}
	n, err := strconv.Atoi(s)
	if err != nil {
		return def
	}
	return n
}

func clampInt(n, lo, hi int) int {
	if n < lo {
		return lo
	}
	if n > hi {
		return hi
	}
	return n
}
