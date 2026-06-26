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
