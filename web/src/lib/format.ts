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
