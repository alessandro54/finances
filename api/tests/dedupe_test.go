package tests

import (
	"context"
	"testing"

	"finances-api/internal/service"
)

// Same purchase captured twice with different merchant text + a stray format diff
// must collapse to one visible row; the most descriptive merchant survives.
func TestDedupeSoftDeletesDuplicatesKeepingBestMerchant(t *testing.T) {
	bdb := testDB(t)
	defer bdb.Close()
	ctx := context.Background()
	svc := service.New(bdb)

	exec := func(q string, args ...any) {
		if _, err := bdb.ExecContext(ctx, q, args...); err != nil {
			t.Fatal(err)
		}
	}
	ins := func(id, date, tm, bank string, amt float64, merchant string) {
		exec(`INSERT INTO transactions (dedupe_id,date,time,bank,amount,currency,merchant,merchant_clean)
		      VALUES (?,?,?,?,?,'PEN',?,?)`, id, date, tm, bank, amt, merchant, merchant)
	}

	// dup pair: same date/time/amount/currency, different merchant text
	ins("ib:1", "2026-06-24", "11:03", "Interbank", 75.11, "Vivanda Javier Prado")
	ins("ib:2", "2026-06-24", "11:03", "Interbank", 75.11, "Vivanda")
	// distinct row, same day different amount -> must survive
	ins("ib:3", "2026-06-24", "15:00", "Interbank", 40.00, "Plaza Vea")
	// incomplete row (no time) -> never auto-removed even though amount repeats
	exec(`INSERT INTO transactions (dedupe_id,date,bank,amount,currency,merchant)
	      VALUES ('ib:4','2026-06-24','Interbank',75.11,'PEN','partial')`)

	n, err := svc.Dedupe(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if n != 1 {
		t.Fatalf("soft-deleted %d, want 1", n)
	}

	// the generic-named dup is gone; the descriptive one stays
	var deleted []string
	if err := bdb.NewRaw(`SELECT dedupe_id FROM transactions WHERE deleted_at IS NOT NULL ORDER BY dedupe_id`).
		Scan(ctx, &deleted); err != nil {
		t.Fatal(err)
	}
	if len(deleted) != 1 || deleted[0] != "ib:2" {
		t.Fatalf("deleted=%v, want [ib:2] (the shorter merchant)", deleted)
	}

	var live int
	if err := bdb.NewRaw(`SELECT COUNT(*) FROM transactions WHERE deleted_at IS NULL`).Scan(ctx, &live); err != nil {
		t.Fatal(err)
	}
	if live != 3 { // ib:1, ib:3, ib:4
		t.Fatalf("live=%d, want 3", live)
	}

	// idempotent: a second sweep changes nothing
	if n2, err := svc.Dedupe(ctx); err != nil || n2 != 0 {
		t.Fatalf("second sweep n=%d err=%v, want 0/nil", n2, err)
	}
}
