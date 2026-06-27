// Server-side FX rates → PEN, fetched from a free no-key API and cached in memory.
// Falls back to constants if the API is unreachable.
const FALLBACK = { USD: 3.75, EUR: 4.05 };
const TTL = 60 * 60 * 1000; // 1h

let cache: { at: number; rates: { USD: number; EUR: number } } | null = null;

export async function getRates(
	fetchFn: typeof fetch = fetch
): Promise<{ USD: number; EUR: number }> {
	if (cache && Date.now() - cache.at < TTL) return cache.rates;
	try {
		const r = await fetchFn('https://open.er-api.com/v6/latest/USD');
		const j = await r.json();
		const usdPen = j?.rates?.PEN;
		const usdEur = j?.rates?.EUR;
		if (usdPen) {
			const rates = { USD: usdPen, EUR: usdEur ? usdPen / usdEur : FALLBACK.EUR };
			cache = { at: Date.now(), rates };
			return rates;
		}
	} catch {
		/* fall through to fallback */
	}
	return FALLBACK;
}
