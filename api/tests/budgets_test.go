// Black-box tests: open an in-memory SQLite, apply the real Bun migrations, and
// exercise the cycle-window + budget-status SQL through the service package.
package tests

import (
	"context"
	"database/sql"
	"testing"

	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/sqlitedialect"
	_ "modernc.org/sqlite"

	"finances-api/internal/db"
	"finances-api/internal/service"
)

func testDB(t *testing.T) *bun.DB {
	t.Helper()
	sqldb, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatal(err)
	}
	sqldb.SetMaxOpenConns(1) // keep every query on the same in-memory connection
	bdb := bun.NewDB(sqldb, sqlitedialect.New())
	if err := db.Migrate(context.Background(), bdb); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	return bdb
}

func TestCycleWindow(t *testing.T) {
	bdb := testDB(t)
	defer bdb.Close()
	ctx := context.Background()
	svc := service.New(bdb)

	cases := []struct {
		ref        string
		day        int
		start, end string
		desc       string
	}{
		{"2026-06-10", 5, "2026-06-05", "2026-07-05", "after start day -> this month"},
		{"2026-06-03", 5, "2026-05-05", "2026-06-05", "before start day -> prev month"},
		{"2026-06-05", 5, "2026-06-05", "2026-07-05", "on start day -> inclusive"},
		{"2026-01-03", 5, "2025-12-05", "2026-01-05", "year rollover"},
	}
	for _, c := range cases {
		start, end, err := svc.CycleWindow(ctx, c.ref, c.day)
		if err != nil {
			t.Fatalf("%s: %v", c.desc, err)
		}
		if start != c.start || end != c.end {
			t.Errorf("%s: ref %s day %d -> [%s,%s) want [%s,%s)", c.desc, c.ref, c.day, start, end, c.start, c.end)
		}
	}
}

func TestCycleWindowDays(t *testing.T) {
	bdb := testDB(t)
	defer bdb.Close()
	ctx := context.Background()
	svc := service.New(bdb)
	cases := []struct {
		anchor     string
		length     int
		ref        string
		start, end string
	}{
		{"2026-06-19", 30, "2026-07-10", "2026-06-19", "2026-07-19"},
		{"2026-06-19", 30, "2026-07-25", "2026-07-19", "2026-08-18"},
		{"2026-06-19", 30, "2026-06-19", "2026-06-19", "2026-07-19"},
	}
	for _, c := range cases {
		s, e, err := svc.CycleWindowDays(ctx, c.anchor, c.length, c.ref)
		if err != nil {
			t.Fatal(err)
		}
		if s != c.start || e != c.end {
			t.Errorf("anchor %s len %d ref %s -> [%s,%s) want [%s,%s)", c.anchor, c.length, c.ref, s, e, c.start, c.end)
		}
	}
}

func TestBudgetStatusSumsOnlyCardTxInWindow(t *testing.T) {
	bdb := testDB(t)
	defer bdb.Close()
	ctx := context.Background()
	svc := service.New(bdb)

	exec := func(q string, args ...any) {
		if _, err := bdb.ExecContext(ctx, q, args...); err != nil {
			t.Fatal(err)
		}
	}
	exec("INSERT INTO cards (bank,name,cycle_start_day) VALUES ('BBVA','BBVA',5)")
	exec("INSERT INTO budgets (card,category,currency,cycle_limit) VALUES ('BBVA','dining','PEN',300)")
	tx := func(id, date, bank string, amt float64) {
		exec("INSERT INTO transactions (dedupe_id,date,bank,amount,currency,category) VALUES (?,?,?,?,'PEN','dining')",
			id, date, bank, amt)
	}
	tx("a", "2026-06-10", "BBVA", 100)        // in window
	tx("b", "2026-06-20", "BBVA", 50)         // in window
	tx("c", "2026-06-03", "BBVA", 999)        // before window (prev cycle)
	tx("d", "2026-07-05", "BBVA", 999)        // == end, exclusive -> out
	tx("e", "2026-06-15", "Diners Club", 999) // other card -> out

	start, end, err := svc.CycleWindow(ctx, "2026-06-10", 5)
	if err != nil {
		t.Fatal(err)
	}
	var row service.StatusRow
	err = bdb.NewRaw(service.BudgetStatusCycleSQL, "BBVA", start, end, "BBVA").Scan(ctx, &row)
	if err != nil {
		t.Fatal(err)
	}
	if row.Category != "dining" || row.CycleLimit != 300 || row.Spent != 150 {
		t.Errorf("got cat=%s limit=%v spent=%v; want dining/300/150", row.Category, row.CycleLimit, row.Spent)
	}
}
