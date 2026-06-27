// Package db opens the Bun connection over the remote libSQL (Turso) driver and
// runs embedded migrations. Remote-only (pure-Go driver, no CGO).
package db

import (
	"context"
	"database/sql"
	"embed"
	"fmt"
	"io/fs"
	"log"
	"path"
	"sort"
	"strings"

	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/sqlitedialect"

	_ "github.com/tursodatabase/libsql-client-go/libsql"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

// Open dials Turso and wraps it in a Bun DB using the SQLite dialect.
//
// We force the https:// (stateless HTTP) transport rather than libsql:// — the
// websocket Hrana stream drops mid-migration with "stream is closed".
func Open(url, token string) (*bun.DB, error) {
	url = strings.Replace(url, "libsql://", "https://", 1)
	sqldb, err := sql.Open("libsql", url+"?authToken="+token)
	if err != nil {
		return nil, err
	}
	return bun.NewDB(sqldb, sqlitedialect.New()), nil
}

// Migrate applies unapplied migrations/*.up.sql, each within a single transaction.
// Statements are separated by `--bun:split`. The whole migration runs as one tx so
// the libsql HTTP driver sends it as a single batched request (per-statement Execs
// otherwise lose the stream baton → "stream is closed: driver: bad connection").
func Migrate(ctx context.Context, bdb *bun.DB) error {
	if _, err := bdb.ExecContext(ctx,
		`CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT DEFAULT (datetime('now')))`,
	); err != nil {
		return fmt.Errorf("ensure schema_migrations: %w", err)
	}

	var appliedNames []string
	if err := bdb.NewRaw("SELECT name FROM schema_migrations").Scan(ctx, &appliedNames); err != nil {
		return err
	}
	applied := make(map[string]bool, len(appliedNames))
	for _, n := range appliedNames {
		applied[n] = true
	}

	files, err := fs.Glob(migrationsFS, "migrations/*.up.sql")
	if err != nil {
		return err
	}
	sort.Strings(files)

	for _, f := range files {
		name := strings.TrimSuffix(path.Base(f), ".up.sql")
		if applied[name] {
			continue
		}
		body, err := migrationsFS.ReadFile(f)
		if err != nil {
			return err
		}
		stmts := splitStatements(string(body))
		err = bdb.RunInTx(ctx, nil, func(ctx context.Context, tx bun.Tx) error {
			for _, s := range stmts {
				if _, e := tx.ExecContext(ctx, s); e != nil {
					return e
				}
			}
			_, e := tx.ExecContext(ctx, "INSERT INTO schema_migrations (name) VALUES (?)", name)
			return e
		})
		if err != nil {
			return fmt.Errorf("migration %s: %w", name, err)
		}
		log.Printf("applied migration %s", name)
	}
	return nil
}

// splitStatements breaks a migration file on `--bun:split` markers.
func splitStatements(body string) []string {
	var out []string
	for _, chunk := range strings.Split(body, "--bun:split") {
		if s := strings.TrimSpace(chunk); s != "" {
			out = append(out, s)
		}
	}
	return out
}
