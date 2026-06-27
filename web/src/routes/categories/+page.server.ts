import { api } from '$lib/api';
import { demoCategories, demoCounts, demoTransactions } from '$lib/server/demo';
import { fail } from '@sveltejs/kit';
import type { Stats } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.owner) {
		return { categories: demoCategories(), counts: demoCounts(demoTransactions('')) };
	}

	const [categories, stats] = await Promise.all([
		api<string[]>('/api/categories'),
		api<Stats>('/api/stats') // all-time, for usage counts
	]);
	// sum tx count per category name across currencies
	const counts: Record<string, number> = {};
	for (const c of stats.by_category) {
		if (c.category) counts[c.category] = (counts[c.category] ?? 0) + c.count;
	}
	return { categories, counts };
};

export const actions: Actions = {
	add: async ({ request, locals }) => {
		if (!locals.owner) return fail(403, { error: 'read-only demo' });
		const f = await request.formData();
		const name = String(f.get('name') ?? '').trim();
		if (!name) return fail(400, { error: 'name required' });
		await api('/api/categories', { method: 'POST', body: JSON.stringify({ name }) });
		return { ok: true };
	},
	remove: async ({ request, locals }) => {
		if (!locals.owner) return fail(403, { error: 'read-only demo' });
		const f = await request.formData();
		const name = String(f.get('name') ?? '');
		if (!name) return fail(400, { error: 'name required' });
		await api(`/api/categories/${encodeURIComponent(name)}`, { method: 'DELETE' });
		return { ok: true };
	}
};
