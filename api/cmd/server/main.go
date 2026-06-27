// finances-api — thin HTTP layer over the Turso (libSQL) expenses DB, via Bun.
// Remote-only (pure-Go libsql driver, no CGO). Auto-migrates on boot.
package main

import (
	"context"
	"log"
	"net/http"

	"finances-api/internal/config"
	"finances-api/internal/db"
	"finances-api/internal/handler"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	bdb, err := db.Open(cfg.TursoURL, cfg.TursoToken)
	if err != nil {
		log.Fatalf("open db: %v", err)
	}
	defer bdb.Close()

	if err := db.Migrate(context.Background(), bdb); err != nil {
		log.Fatalf("migrate: %v", err)
	}

	h := handler.New(bdb, cfg.APIToken)
	log.Printf("listening on :%s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, h.Router()); err != nil {
		log.Fatal(err)
	}
}
