// Synthetic dataset served to guests (not logged in). Deterministic — same
// output for a given month so charts/tables look stable across requests. Real
// data never leaves the server for guests; this stands in for all of it.
import type { BudgetStatus, Card, Stats, Transaction } from '$lib/types';

const CATS = ['Dining', 'Groceries', 'Transport', 'Subscriptions', 'Health', 'Entertainment', 'Utilities'];

const MERCHANTS: Record<string, string[]> = {
	Dining: ['Starbucks', 'La Lucha', 'Tanta', 'Bembos', 'Juan Valdez', 'Pardos'],
	Groceries: ['Plaza Vea', 'Wong', 'Tottus', 'Metro', 'Vivanda'],
	Transport: ['Uber', 'Cabify', 'Beat', 'Primax', 'Repsol'],
	Subscriptions: ['Netflix', 'Spotify', 'YouTube Premium', 'iCloud', 'Disney+'],
	Health: ['InkaFarma', 'MiFarma', 'Smart Fit', 'Clínica Internacional'],
	Entertainment: ['Cineplanet', 'Cinemark', 'Steam', 'PlayStation Store'],
	Utilities: ['Movistar', 'Claro', 'Sedapal', 'Luz del Sur']
};

// per-category amount band (PEN)
const BANDS: Record<string, [number, number]> = {
	Dining: [12, 90],
	Groceries: [40, 260],
	Transport: [8, 45],
	Subscriptions: [16, 55],
	Health: [20, 180],
	Entertainment: [18, 120],
	Utilities: [60, 200]
};

const BANKS = ['BBVA', 'Diners', 'Interbank'];
const LAST4: Record<string, string> = { BBVA: '9788', Diners: '4421', Interbank: '1829' };

// small deterministic LCG so the demo is stable per (month) but varied
function rng(seed: number) {
	let s = seed >>> 0;
	return () => {
		s = (s * 1664525 + 1013904223) >>> 0;
		return s / 0xffffffff;
	};
}

function seedFrom(str: string): number {
	let h = 2166136261;
	for (let i = 0; i < str.length; i++) h = (h ^ str.charCodeAt(i)) * 16777619;
	return h >>> 0;
}

function pad(n: number): string {
	return n < 10 ? '0' + n : '' + n;
}

/** Resolve the target month (YYYY-MM) and its day count. */
function resolveMonth(month: string): { ym: string; year: number; mon: number; days: number } {
	const now = new Date();
	let year = now.getFullYear();
	let mon = now.getMonth() + 1;
	if (/^\d{4}-\d{2}$/.test(month)) {
		year = Number(month.slice(0, 4));
		mon = Number(month.slice(5, 7));
	}
	const days = new Date(year, mon, 0).getDate();
	return { ym: `${year}-${pad(mon)}`, year, mon, days };
}

export function demoTransactions(month: string): Transaction[] {
	const { ym, days } = resolveMonth(month);
	const r = rng(seedFrom(ym));
	const today = new Date();
	const isCurrent = ym === `${today.getFullYear()}-${pad(today.getMonth() + 1)}`;
	const lastDay = isCurrent ? today.getDate() : days;

	const n = 38 + Math.floor(r() * 12);
	const txs: Transaction[] = [];
	for (let i = 0; i < n; i++) {
		const cat = CATS[Math.floor(r() * CATS.length)];
		const list = MERCHANTS[cat];
		const merchant = list[Math.floor(r() * list.length)];
		const [lo, hi] = BANDS[cat];
		const usd = r() < 0.12;
		const base = lo + r() * (hi - lo);
		const amount = usd ? Math.round((base / 3.75) * 100) / 100 : Math.round(base * 100) / 100;
		const day = 1 + Math.floor(r() * lastDay);
		const hh = 7 + Math.floor(r() * 15);
		const mm = Math.floor(r() * 60);
		const bank = BANKS[Math.floor(r() * BANKS.length)];
		// a couple of low/medium-confidence rows to show the review UI shape
		const conf = i === 3 ? 'low' : i === 9 ? 'medium' : 'high';
		txs.push({
			dedupe_id: `demo-${ym}-${i}`,
			date: `${ym}-${pad(day)}`,
			time: `${pad(hh)}:${pad(mm)}`,
			bank,
			card_last4: LAST4[bank],
			amount,
			currency: usd ? 'USD' : 'PEN',
			merchant,
			merchant_clean: merchant,
			transaction_type: 'purchase',
			channel: 'card',
			confidence: conf,
			category: cat,
			source: 'demo',
			created_at: `${ym}-${pad(day)}T${pad(hh)}:${pad(mm)}:00`
		});
	}
	// newest first, matching the real API ordering
	txs.sort((a, b) => (a.date! + a.time! < b.date! + b.time! ? 1 : -1));
	return txs;
}

export function demoStats(month: string, txs: Transaction[]): Stats {
	const { ym } = resolveMonth(month);
	const cur = new Map<string, { total: number; count: number }>();
	const cat = new Map<string, { total: number; count: number }>();
	const bank = new Map<string, number>();
	const day = new Map<string, number>();
	for (const t of txs) {
		const c = t.currency ?? 'PEN';
		const amt = t.amount ?? 0;
		const cu = cur.get(c) ?? { total: 0, count: 0 };
		cu.total += amt;
		cu.count += 1;
		cur.set(c, cu);
		const ck = `${t.category}|${c}`;
		const ca = cat.get(ck) ?? { total: 0, count: 0 };
		ca.total += amt;
		ca.count += 1;
		cat.set(ck, ca);
		bank.set(`${t.bank}|${c}`, (bank.get(`${t.bank}|${c}`) ?? 0) + amt);
		day.set(`${t.date}|${c}`, (day.get(`${t.date}|${c}`) ?? 0) + amt);
	}
	return {
		month: ym,
		by_currency: [...cur.entries()].map(([currency, v]) => ({ currency, total: v.total, count: v.count })),
		by_category: [...cat.entries()]
			.map(([k, v]) => ({ category: k.split('|')[0], currency: k.split('|')[1], total: v.total, count: v.count }))
			.sort((a, b) => b.total - a.total),
		by_bank: [...bank.entries()].map(([k, total]) => ({ bank: k.split('|')[0], currency: k.split('|')[1], total })),
		by_day: [...day.entries()]
			.map(([k, total]) => ({ date: k.split('|')[0], currency: k.split('|')[1], total }))
			.sort((a, b) => (a.date! < b.date! ? -1 : 1))
	};
}

export function demoCategories(): string[] {
	return [...CATS].sort();
}

export function demoCounts(txs: Transaction[]): Record<string, number> {
	const m: Record<string, number> = {};
	for (const t of txs) if (t.category) m[t.category] = (m[t.category] ?? 0) + 1;
	return m;
}

export function demoCards(): Card[] {
	return [
		{ bank: 'BBVA', name: 'BBVA Visa', card_last4: '9788', cycle_start_day: 11, cycle_type: 'monthly', cycle_length_days: null, cycle_anchor: null },
		{ bank: 'Diners', name: 'Diners Club', card_last4: '4421', cycle_start_day: 26, cycle_type: 'monthly', cycle_length_days: null, cycle_anchor: null },
		{ bank: 'Interbank', name: 'Interbank', card_last4: '1829', cycle_start_day: 1, cycle_type: 'days', cycle_length_days: 29, cycle_anchor: '2026-06-20' }
	];
}

function row(category: string, currency: string, limit: number, spent: number) {
	const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
	return { category, currency, limit, spent, remaining: limit - spent, over: spent > limit, pct };
}

export function demoStatuses(): Record<string, BudgetStatus> {
	return {
		BBVA: {
			card: 'BBVA',
			cycle_start: '2026-06-11',
			cycle_end: '2026-07-11',
			budgets: [row('Dining', 'PEN', 600, 412), row('Groceries', 'PEN', 900, 734), row('Transport', 'PEN', 300, 318)]
		},
		Diners: {
			card: 'Diners',
			cycle_start: '2026-06-26',
			cycle_end: '2026-07-26',
			budgets: [row('Subscriptions', 'PEN', 200, 156), row('Entertainment', 'PEN', 250, 88)]
		},
		Interbank: {
			card: 'Interbank',
			cycle_start: '2026-06-20',
			cycle_end: '2026-07-19',
			budgets: [row('Health', 'PEN', 400, 240), row('Utilities', 'PEN', 500, 463)]
		}
	};
}
