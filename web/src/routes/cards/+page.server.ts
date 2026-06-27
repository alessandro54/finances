import { api } from '$lib/api';
import { getRates } from '$lib/server/fx';
import { fail } from '@sveltejs/kit';
import type { BudgetStatus, Card } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const [cards, categories, rates] = await Promise.all([
		api<Card[]>('/api/cards'),
		api<string[]>('/api/categories'),
		getRates(fetch)
	]);
	// Per-card current-cycle budget status (spend vs limit over the billing cycle).
	const statuses = await Promise.all(
		cards.map((c) => api<BudgetStatus>(`/api/budget-status?card=${encodeURIComponent(c.bank)}`))
	);
	const status: Record<string, BudgetStatus> = {};
	cards.forEach((c, i) => (status[c.bank] = statuses[i]));
	return { cards, categories, status, rates };
};

export const actions: Actions = {
	saveCard: async ({ request }) => {
		const f = await request.formData();
		const bank = String(f.get('bank') ?? '').trim();
		if (!bank) return fail(400, { error: 'bank required' });
		await api('/api/cards', {
			method: 'POST',
			body: JSON.stringify({
				bank,
				name: String(f.get('name') ?? '') || null,
				card_last4: String(f.get('card_last4') ?? '') || null,
				cycle_start_day: Number(f.get('cycle_start_day') ?? 1)
			})
		});
		return { ok: true };
	},

	deleteCard: async ({ request }) => {
		const f = await request.formData();
		const bank = String(f.get('bank') ?? '');
		if (!bank) return fail(400, { error: 'bank required' });
		await api(`/api/cards/${encodeURIComponent(bank)}`, { method: 'DELETE' });
		return { ok: true };
	},

	saveBudget: async ({ request }) => {
		const f = await request.formData();
		const card = String(f.get('card') ?? '');
		const category = String(f.get('category') ?? '');
		const cycle_limit = Number(f.get('cycle_limit') ?? 0);
		if (!card || !category) return fail(400, { error: 'card + category required' });
		await api('/api/budgets', {
			method: 'PUT',
			body: JSON.stringify({
				card,
				category,
				currency: String(f.get('currency') ?? 'PEN'),
				cycle_limit
			})
		});
		return { ok: true };
	}
};
