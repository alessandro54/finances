<script lang="ts">
	import { toPEN } from '$lib/format';
	import { cycleWindow, plan, addDays, addMonths, ymd, todayLima } from '$lib/cycle';
	import type { Card, Transaction } from '$lib/types';

	let {
		card,
		transactions,
		fmt
	}: { card: Card; transactions: Transaction[]; fmt: (n: number) => string } = $props();

	const today = todayLima();
	let view = $state(todayLima());

	// Spend per day (soles) for this card's bank only.
	const spendMap = $derived(
		(() => {
			const m = new Map<string, { pen: number; count: number }>();
			for (const t of transactions) {
				if (t.bank !== card.bank || !t.date) continue;
				const k = t.date.slice(0, 10);
				const cur = m.get(k) ?? { pen: 0, count: 0 };
				cur.pen += toPEN(t.amount, t.currency);
				cur.count += 1;
				m.set(k, cur);
			}
			return m;
		})()
	);

	const p = $derived(plan(card, today));
	const active = $derived(p.cur); // the statement currently accruing
	const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

	const cells = $derived(
		(() => {
			const vy = view.getUTCFullYear();
			const vm = view.getUTCMonth();
			const first = new Date(Date.UTC(vy, vm, 1));
			const lead = (first.getUTCDay() + 6) % 7; // Monday-based
			const gridStart = addDays(first, -lead);
			const out = [];
			for (let i = 0; i < 42; i++) {
				const d = addDays(gridStart, i);
				const key = ymd(d);
				const s = spendMap.get(key);
				const cw = cycleWindow(card, d);
				out.push({
					key,
					day: d.getUTCDate(),
					inMonth: d.getUTCMonth() === vm,
					spend: s?.pen ?? 0,
					count: s?.count ?? 0,
					isStart: ymd(cw.start) === key,
					isClose: ymd(addDays(cw.end, -1)) === key,
					isBest: ymd(p.bestDay) === key,
					isToday: key === ymd(today),
					active: d >= active.start && d < active.end
				});
			}
			return out;
		})()
	);

	const maxSpend = $derived(Math.max(1, ...cells.map((c) => c.spend)));
	function heat(spend: number): string {
		if (spend <= 0) return 'transparent';
		const pct = 12 + 68 * (spend / maxSpend);
		return `color-mix(in srgb, var(--accent) ${pct.toFixed(0)}%, transparent)`;
	}

	const monthLabel = $derived(
		new Date(Date.UTC(view.getUTCFullYear(), view.getUTCMonth(), 1)).toLocaleDateString('en-US', {
			month: 'long',
			year: 'numeric',
			timeZone: 'UTC'
		})
	);
	const step = (n: number) => (view = addMonths(view, n));
</script>

<div class="flex items-center justify-between gap-3">
	<h2 class="text-sm font-semibold">{monthLabel}</h2>
	<div class="flex gap-1">
		<button
			onclick={() => step(-1)}
			class="grid h-7 w-7 place-items-center rounded-md border border-border text-muted hover:border-accent hover:text-text"
			aria-label="Previous month">‹</button
		>
		<button
			onclick={() => (view = new Date(today))}
			class="rounded-md border border-border px-2 text-xs text-muted hover:border-accent hover:text-text">Today</button
		>
		<button
			onclick={() => step(1)}
			class="grid h-7 w-7 place-items-center rounded-md border border-border text-muted hover:border-accent hover:text-text"
			aria-label="Next month">›</button
		>
	</div>
</div>

<div class="mt-3 grid grid-cols-7 gap-1 text-center text-[0.65rem] font-semibold uppercase tracking-wide text-muted">
	{#each WEEKDAYS as w}<span>{w}</span>{/each}
</div>

<div class="mt-1 grid grid-cols-7 gap-1">
	{#each cells as c (c.key)}
		<div
			class="relative flex min-h-[3.2rem] flex-col rounded-md border p-1.5 text-xs transition-colors {c.inMonth
				? ''
				: 'opacity-35'} {c.active ? 'border-accent/45' : 'border-border/40'}"
			style="background: {heat(c.spend)}"
			title="{c.key} · S/ {fmt(c.spend)} · {c.count} tx{c.isClose ? ' · statement closes' : ''}"
		>
			<div class="flex items-center justify-between">
				<span
					class={c.isToday
						? 'grid h-5 w-5 place-items-center rounded-full bg-accent text-[0.7rem] font-bold text-white'
						: 'font-medium'}>{c.day}</span
				>
				{#if c.isBest}<span title="Best day to spend — longest interest-free runway">⭐</span>{/if}
			</div>
			{#if c.spend > 0}
				<div class="mt-auto truncate text-[0.62rem] font-medium tabular-nums">{fmt(c.spend)}</div>
			{/if}
			{#if c.isStart}<div class="absolute inset-y-1 left-0 w-[3px] rounded-full bg-accent"></div>{/if}
			{#if c.isClose}
				<div class="absolute bottom-0.5 right-1 text-[0.5rem] font-bold uppercase tracking-wide text-warn-text">
					close
				</div>
			{/if}
		</div>
	{/each}
</div>

<div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.7rem] text-muted">
	<span class="flex items-center gap-1.5"><span class="h-3 w-[3px] rounded-full bg-accent"></span> cycle opens</span>
	<span class="flex items-center gap-1.5"><span class="font-bold uppercase text-warn-text">close</span> statement closes</span>
	<span>⭐ best day to spend</span>
	<span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded border border-accent/45"></span> current cycle</span>
	<span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded" style="background: {heat(maxSpend)}"></span> more spend</span>
</div>
