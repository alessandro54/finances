import { api } from '$lib/api';
import { getRates } from '$lib/server/fx';
import { fail } from '@sveltejs/kit';
import type { Stats, Transaction } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, fetch }) => {
	const month = url.searchParams.get('month') ?? '';
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
	recategorize: async ({ request }) => {
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

	review: async ({ request }) => {
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
