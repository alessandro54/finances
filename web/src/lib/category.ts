// Client-safe helpers (no server-only imports — usable in .svelte components).

export const OTHERS = 'Others';

/** Raw display label for a possibly-null/blank category. */
export function catLabel(c: string | null | undefined): string {
	return c && c.trim() ? c : OTHERS;
}

/** Capitalized label for display ("food & drink" → "Food & Drink"). */
export function catDisplay(c: string | null | undefined): string {
	return catLabel(c).replace(/\b\w/g, (m) => m.toUpperCase());
}

// A small, cohesive palette for category accents (indigo → teal → amber range).
const PALETTE = [
	'#6366f1', // indigo
	'#0ea5e9', // sky
	'#14b8a6', // teal
	'#f59e0b', // amber
	'#ec4899', // pink
	'#8b5cf6', // violet
	'#10b981', // emerald
	'#ef4444', // red
	'#f97316', // orange
	'#06b6d4' // cyan
];

/** Deterministic color for a category label (stable across renders). */
export function catColor(c: string | null | undefined): string {
	const label = catLabel(c);
	if (label === OTHERS) return '#94a3b8'; // slate — neutral bucket
	let h = 0;
	for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) >>> 0;
	return PALETTE[h % PALETTE.length];
}
