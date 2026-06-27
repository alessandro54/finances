export type Transaction = {
	dedupe_id: string;
	date: string | null;
	time: string | null;
	bank: string | null;
	card_last4: string | null;
	amount: number | null;
	currency: string | null;
	merchant: string | null;
	merchant_clean: string | null;
	transaction_type: string | null;
	channel: string | null;
	confidence: string | null;
	category: string | null;
	source: string | null;
	created_at: string | null;
};

export type CurrencyTotal = { currency: string | null; total: number; count: number };
export type CategoryTotal = { category: string | null; currency: string | null; total: number; count: number };
export type BankTotal = { bank: string | null; currency: string | null; total: number };
export type DayTotal = { date: string | null; currency: string | null; total: number };

export type Stats = {
	month: string | null;
	by_currency: CurrencyTotal[];
	by_category: CategoryTotal[];
	by_bank: BankTotal[];
	by_day: DayTotal[];
};

export type Card = {
	bank: string;
	name: string | null;
	card_last4: string | null;
	cycle_start_day: number;
	cycle_type: 'monthly' | 'days';
	cycle_length_days: number | null;
	cycle_anchor: string | null;
};

export type BudgetRow = {
	category: string;
	currency: string;
	limit: number;
	spent: number;
	remaining: number;
	over: boolean;
	pct: number;
};

export type BudgetStatus = {
	card?: string;
	cycle_start?: string;
	cycle_end?: string;
	month?: string;
	budgets: BudgetRow[];
};
