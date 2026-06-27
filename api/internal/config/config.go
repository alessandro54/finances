// Package config loads and validates runtime configuration from the environment.
package config

import (
	"fmt"
	"os"
	"strings"
)

type Config struct {
	TursoURL   string // TURSO_DATABASE_URL
	TursoToken string // TURSO_AUTH_TOKEN
	APIToken   string // API_TOKEN — bearer the dash/LLM must send
	Port       string // PORT (default 8080)
}

// Load reads config from the environment and errors if any required var is missing.
func Load() (Config, error) {
	c := Config{
		TursoURL:   os.Getenv("TURSO_DATABASE_URL"),
		TursoToken: os.Getenv("TURSO_AUTH_TOKEN"),
		APIToken:   os.Getenv("API_TOKEN"),
		Port:       envDefault("PORT", "8080"),
	}

	var missing []string
	if c.TursoURL == "" {
		missing = append(missing, "TURSO_DATABASE_URL")
	}
	if c.TursoToken == "" {
		missing = append(missing, "TURSO_AUTH_TOKEN")
	}
	if c.APIToken == "" {
		missing = append(missing, "API_TOKEN")
	}
	if len(missing) > 0 {
		return c, fmt.Errorf("missing required env: %s", strings.Join(missing, ", "))
	}
	return c, nil
}

func envDefault(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
