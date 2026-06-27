const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2025-06-15" + "14:34" → "15 Jun 2:34PM" (time optional). */
export function fmtWhen(date: string | null, time: string | null): string {
	if (!date) return '';
	const [, m, d] = date.split('-').map(Number);
	let out = `${d} ${MONTHS[(m || 1) - 1]}`;
	if (time) {
		const [hh, mm] = time.split(':').map(Number);
		const ap = hh >= 12 ? 'PM' : 'AM';
		const h12 = hh % 12 || 12;
		out += ` ${h12}:${String(mm ?? 0).padStart(2, '0')} ${ap}`;
	}
	return out;
}

/** 1234.5 → "1,234.50" */
export function fmtMoney(n: number | null): string {
	return (n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// FX → PEN. Seeded with fallbacks; setRates() updates from the live API (see lib/server/fx).
const FX_TO_PEN: Record<string, number> = { PEN: 1, USD: 3.75, EUR: 4.05 };

/** Update live rates (USD/EUR → PEN). Called from pages with server-loaded rates. */
export function setRates(r: { USD?: number; EUR?: number } | undefined | null): void {
	if (!r) return;
	if (r.USD) FX_TO_PEN.USD = r.USD;
	if (r.EUR) FX_TO_PEN.EUR = r.EUR;
}

/** Currency symbol: PEN → "S/", USD → "$", EUR → "€". */
export function sym(currency: string | null | undefined): string {
	if (currency === 'USD') return '$';
	if (currency === 'EUR') return '€';
	return 'S/';
}

/** Symbol + amount, e.g. "S/ 12.34" or "$ 16.51". */
export function money(amount: number | null, currency: string | null | undefined): string {
	return `${sym(currency)} ${fmtMoney(amount)}`;
}

/** Convert an amount to PEN (null/PEN → unchanged). */
export function toPEN(amount: number | null, currency: string | null | undefined): number {
	return (amount ?? 0) * (FX_TO_PEN[currency ?? 'PEN'] ?? 1);
}

/** True when the amount should show a soles conversion (non-PEN). */
export function isForeign(currency: string | null | undefined): boolean {
	return !!currency && currency !== 'PEN';
}
