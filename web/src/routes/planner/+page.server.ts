import { api } from '$lib/api';
import { getRates } from '$lib/server/fx';
import { demoTransactions, demoCards } from '$lib/server/demo';
import type { Card, Transaction } from '$lib/types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals }) => {
	if (!locals.owner) {
		return { cards: demoCards(), transactions: demoTransactions(''), rates: await getRates(fetch) };
	}
	const [cards, transactions, rates] = await Promise.all([
		api<Card[]>('/api/cards'),
		api<Transaction[]>('/api/transactions?limit=1000'),
		getRates(fetch)
	]);
	return { cards, transactions, rates };
};
