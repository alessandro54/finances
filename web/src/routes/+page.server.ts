import { api } from '$lib/api';
import { getRates } from '$lib/server/fx';
import { demoTransactions, demoStats, demoCategories } from '$lib/server/demo';
import { fail } from '@sveltejs/kit';
import type { Stats, Transaction } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, fetch, locals }) => {
	const month = url.searchParams.get('month') ?? '';

	// Guests get a deterministic synthetic dataset — real data never leaves the server.
	if (!locals.owner) {
		const transactions = demoTransactions(month);
		return {
			month,
			stats: demoStats(month, transactions),
			transactions,
			categories: demoCategories(),
			rates: await getRates(fetch)
		};
	}

	const qs = month ? `?month=${month}` : '';
	const [stats, transactions, categories, rates] = await Promise.all([
		api<Stats>(`/api/stats${qs}`),
		api<Transaction[]>(`/api/transactions${qs}${qs ? '&' : '?'}limit=200`),
		api<string[]>('/api/categories'),
		getRates(fetch)
	]);
	return { month, stats, transactions, categories, rates };
};

export const actions: Actions = {
	recategorize: async ({ request, locals }) => {
		if (!locals.owner) return fail(403, { error: 'read-only demo' });
		const f = await request.formData();
		const id = String(f.get('id') ?? '');
		const category = String(f.get('category') ?? ''); // '' clears to Others
		if (!id) return fail(400, { error: 'missing id' });
		// Picking the right category counts as reviewing it → clear the flag too.
		await api(`/api/transactions/${encodeURIComponent(id)}`, {
			method: 'PATCH',
			body: JSON.stringify({ category, reviewed: true })
		});
		return { ok: true };
	},

	review: async ({ request, locals }) => {
		if (!locals.owner) return fail(403, { error: 'read-only demo' });
		const f = await request.formData();
		const id = String(f.get('id') ?? '');
		if (!id) return fail(400, { error: 'missing id' });
		await api(`/api/transactions/${encodeURIComponent(id)}`, {
			method: 'PATCH',
			body: JSON.stringify({ reviewed: true })
		});
		return { ok: true };
	}
};
