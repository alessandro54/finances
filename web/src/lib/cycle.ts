// Billing-cycle math, mirrored from the API's CycleWindow SQL (internal/handler
// budgets.go) so the planner can compute windows client-side. All dates are UTC
// midnight to dodge timezone drift; `end` is exclusive (next cycle's start).
import type { Card } from '$lib/types';

export function parseYMD(s: string): Date {
	const [y, m, d] = s.slice(0, 10).split('-').map(Number);
	return new Date(Date.UTC(y, m - 1, d));
}
export function ymd(d: Date): string {
	return d.toISOString().slice(0, 10);
}
export function addDays(d: Date, n: number): Date {
	return new Date(d.getTime() + n * 86400000);
}
export function addMonths(d: Date, n: number): Date {
	return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, d.getUTCDate()));
}
/** Whole days a − b (a and b at UTC midnight). */
export function diffDays(a: Date, b: Date): number {
	return Math.round((a.getTime() - b.getTime()) / 86400000);
}

/** "Today" as a UTC-midnight Date whose Y-M-D is the current wall date in Lima
 * (UTC-5). Deterministic regardless of the host/browser timezone. */
export function todayLima(): Date {
	const s = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'America/Lima',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(new Date());
	return parseYMD(s); // 'YYYY-MM-DD'
}

export type Cycle = { start: Date; end: Date };

/** The billing cycle [start, end) that `ref` falls into for this card. */
export function cycleWindow(card: Card, ref: Date): Cycle {
	if (card.cycle_type === 'days' && card.cycle_length_days && card.cycle_length_days > 0 && card.cycle_anchor) {
		const len = card.cycle_length_days;
		const anchor = parseYMD(card.cycle_anchor);
		const n = Math.floor(diffDays(ref, anchor) / len);
		const start = addDays(anchor, n * len);
		return { start, end: addDays(start, len) };
	}
	const day = Math.min(Math.max(card.cycle_start_day || 1, 1), 28);
	const refDay = ref.getUTCDate();
	const start =
		refDay >= day
			? new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), day))
			: new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() - 1, day));
	return { start, end: addMonths(start, 1) };
}

export function nextCycle(card: Card, c: Cycle): Cycle {
	return cycleWindow(card, c.end);
}
export function prevCycle(card: Card, c: Cycle): Cycle {
	return cycleWindow(card, addDays(c.start, -1));
}

export type Plan = {
	cur: Cycle;
	next: Cycle;
	daysLeft: number; // until the current statement closes
	bestDay: Date; // next cycle's start = longest runway before it bills
	daysToBest: number;
	floatNow: number; // buy today → days until it bills (current close)
	floatWait: number; // buy on bestDay → days until it bills (next close)
	gain: number; // extra interest-free days from waiting
};

/** Spend-timing plan for a card relative to `today`. */
export function plan(card: Card, today: Date): Plan {
	const cur = cycleWindow(card, today);
	const next = nextCycle(card, cur);
	const bestDay = cur.end; // right after the statement closes
	return {
		cur,
		next,
		daysLeft: diffDays(cur.end, today),
		bestDay,
		daysToBest: diffDays(bestDay, today),
		floatNow: diffDays(cur.end, today),
		floatWait: diffDays(next.end, bestDay),
		gain: diffDays(next.end, bestDay) - diffDays(cur.end, today)
	};
}

/** Which statement a purchase on `date` lands on, and its runway before close. */
export function simulate(card: Card, date: Date) {
	const cycle = cycleWindow(card, date);
	return { cycle, closes: cycle.end, daysUntilClose: diffDays(cycle.end, date) };
}

export type CardPick = { card: Card; runway: number; close: Date };

/** Across the fleet, the card that gives the longest runway if charged on `date`. */
export function bestCardOn(cards: Card[], date: Date): CardPick | null {
	let best: CardPick | null = null;
	for (const c of cards) {
		const cw = cycleWindow(c, date);
		const runway = diffDays(cw.end, date);
		if (!best || runway > best.runway) best = { card: c, runway, close: cw.end };
	}
	return best;
}

export type SpendWindow = { card: Card; start: Date; end: Date; startRunway: number };

/** Merge all cards: consecutive days where the same card is optimal collapse into
 * one window. Each window is a stretch where charging `card` maximizes float. */
export function bestCardWindows(cards: Card[], from: Date, days: number): SpendWindow[] {
	if (!cards.length) return [];
	const out: SpendWindow[] = [];
	let cur: SpendWindow | null = null;
	for (let i = 0; i < days; i++) {
		const d = addDays(from, i);
		const b = bestCardOn(cards, d)!;
		if (cur && cur.card.bank === b.card.bank) {
			cur.end = d;
		} else {
			if (cur) out.push(cur);
			cur = { card: b.card, start: d, end: d, startRunway: b.runway };
		}
	}
	if (cur) out.push(cur);
	return out;
}
