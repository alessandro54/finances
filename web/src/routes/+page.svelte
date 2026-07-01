<script lang="ts">
	import { slide } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { onMount } from 'svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { catDisplay, catColor } from '$lib/category';
	import { fmtWhen, fmtMoney as fmt, money, toPEN, isForeign, setRates } from '$lib/format';
	import { bestCardOn, todayLima } from '$lib/cycle';
	import PieChart from '$lib/components/PieChart.svelte';
	import DayBars from '$lib/components/DayBars.svelte';
	import FleetCalendar from '$lib/components/FleetCalendar.svelte';
	import Select from '$lib/components/Select.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	// svelte-ignore state_referenced_locally
	setRates(data.rates); // apply live FX before any money()/toPEN() render (set-once)
	const owner = $derived(page.data.owner ?? false); // guests: read-only demo
	let reviewOpen = $state(false);

	// Animate row changes only after first paint (not the initial bulk load).
	let ready = $state(false);
	onMount(() => {
		ready = true;
	});

	// Flash rows that arrive live (e.g. a Telegram capture pushed via SSE).
	let knownIds = new Set<string>(); // plain bookkeeping (non-reactive)
	let firstLoad = true;
	let justAdded = $state<Set<string>>(new Set());
	$effect(() => {
		const ids = data.transactions.map((t) => t.dedupe_id);
		if (!firstLoad) {
			const fresh = ids.filter((id) => !knownIds.has(id));
			if (fresh.length) {
				justAdded = new Set(fresh);
				setTimeout(() => (justAdded = new Set()), 2200);
			}
		}
		knownIds = new Set(ids);
		firstLoad = false;
	});

	// Rows reviewed/recategorized this session — un-highlight instantly before reload.
	let reviewedLocal = $state<Record<string, boolean>>({});

	const NEEDS = new Set(['low', 'medium']);
	const needsReview = (t: { confidence: string | null; dedupe_id: string }) =>
		!!t.confidence && NEEDS.has(t.confidence) && !reviewedLocal[t.dedupe_id];
	const flagged = $derived(data.transactions.filter(needsReview));

	function onMonth(e: Event) {
		const v = (e.target as HTMLInputElement).value; // 'YYYY-MM' or ''
		goto(v ? `/?month=${v}` : '/', { keepFocus: true });
	}

	// '' clears category to Others; recategorizing also reviews it.
	async function recategorize(id: string, category: string) {
		reviewedLocal[id] = true;
		const fd = new FormData();
		fd.set('id', id);
		fd.set('category', category);
		await fetch('?/recategorize', { method: 'POST', body: fd });
		await invalidateAll();
	}

	async function markReviewed(id: string) {
		reviewedLocal[id] = true;
		const fd = new FormData();
		fd.set('id', id);
		await fetch('?/review', { method: 'POST', body: fd });
		await invalidateAll();
	}

	// Everything rolled up to soles (approx) for one headline total.
	const totalPEN = $derived(
		data.stats.by_currency.reduce((s, c) => s + toPEN(c.total, c.currency), 0)
	);
	const txCount = $derived(data.stats.by_currency.reduce((s, c) => s + c.count, 0));
	const hasForeign = $derived(data.stats.by_currency.some((c) => isForeign(c.currency)));

	// Charts roll every currency up to soles so dollars are included.
	const categoryBars = $derived(
		(() => {
			const map = new Map<string, { value: number; color: string }>();
			for (const c of data.stats.by_category) {
				const label = catDisplay(c.category); // folds null + "other" into Others
				const cur = map.get(label);
				if (cur) cur.value += toPEN(c.total, c.currency);
				else map.set(label, { value: toPEN(c.total, c.currency), color: catColor(c.category) });
			}
			return [...map.entries()]
				.map(([label, v]) => ({ label, value: v.value, color: v.color }))
				.sort((a, b) => b.value - a.value)
				.slice(0, 8);
		})()
	);
	const trendPoints = $derived(
		(() => {
			const map = new Map<string, number>(); // by_day is date-ordered → insertion order is chronological
			for (const d of data.stats.by_day) {
				const day = (d.date ?? '').slice(5);
				map.set(day, (map.get(day) ?? 0) + toPEN(d.total, d.currency));
			}
			return [...map.entries()].map(([date, value]) => ({ date, value }));
		})()
	);

	// Spend split per bank/card, rolled up to soles.
	const bankBars = $derived(
		(() => {
			const map = new Map<string, number>();
			for (const b of data.stats.by_bank) {
				const label = b.bank ?? '—';
				map.set(label, (map.get(label) ?? 0) + toPEN(b.total, b.currency));
			}
			return [...map.entries()]
				.map(([label, value]) => ({ label, value, color: catColor(label) }))
				.sort((a, b) => b.value - a.value);
		})()
	);
	const bankMax = $derived(Math.max(1, ...bankBars.map((b) => b.value)));

	// Day-only planner glance for small/short screens (full calendar shown on lg+).
	const bestToday = $derived(data.cards?.length ? bestCardOn(data.cards, todayLima()) : null);
	const fmtD = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
</script>

<div class="flex flex-col gap-3 md:h-full">
	<div class="flex items-end justify-between gap-4">
		<div>
			<h1 class="m-0 text-xl font-semibold tracking-tight">Transactions</h1>
			<p class="mt-0.5 text-xs text-muted">{data.month || 'All time'} · {txCount} transactions</p>
		</div>
		<label>
			<input
				type="month"
				value={data.month}
				oninput={onMonth}
				class="rounded-[9px] border border-border bg-surface px-2.5 py-1.5 text-sm text-text"
			/>
		</label>
	</div>

	{#if owner && flagged.length}
		<button
			onclick={() => (reviewOpen = true)}
			transition:slide={{ duration: 200 }}
			class="flex w-full shrink-0 items-center justify-between gap-4 rounded-[10px] border border-warn-border bg-warn-bg px-4 py-2 text-left text-sm font-semibold text-warn-text"
		>
			<span class="flex items-center gap-2"><span>⚠</span>
				{flagged.length} transaction{flagged.length > 1 ? 's' : ''} need review</span>
			<span class="whitespace-nowrap">Review →</span>
		</button>
	{/if}

	<!-- Unified grid: analytics on the left, transactions as a tall right rail. -->
	<div class="grid gap-3 md:min-h-0 md:flex-1 md:grid-cols-2 md:grid-rows-[auto_auto_minmax(0,1fr)]">
		<!-- Overview: total spent + by-bank in one panel -->
		<div class="panel flex min-w-0 flex-col gap-3 overflow-auto p-4 md:col-start-1 md:row-start-1">
			{#if data.stats.by_currency.length}
				<div class="flex flex-col gap-0.5">
					<span class="eyebrow text-accent">Total spent</span>
					<span class="text-gradient text-[1.7rem] font-extrabold tabular-nums tracking-tight">{hasForeign ? '≈ ' : ''}S/ {fmt(totalPEN)}</span>
					<div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
						{#each data.stats.by_currency as c}<span>{money(c.total, c.currency)}</span>{/each}
					</div>
				</div>
			{:else}
				<p class="text-sm text-muted">No transactions for this period.</p>
			{/if}

			{#if bankBars.length}
				<div class="flex flex-col gap-1.5 border-t border-border pt-2.5">
					<h3 class="text-[0.68rem] font-semibold uppercase tracking-wider text-muted">By bank <span class="normal-case">S/</span></h3>
					{#each bankBars as b (b.label)}
						<div class="flex items-center gap-2 text-xs">
							<span class="flex w-16 shrink-0 items-center gap-1.5 truncate" title={b.label}>
								<span class="h-2 w-2 shrink-0 rounded-full" style="background: {b.color}"></span>
								<span class="truncate">{b.label}</span>
							</span>
							<div class="rail h-2.5 flex-1 overflow-hidden rounded-[3px]">
								<div class="h-full rounded-[2px] transition-[width] duration-500" style="width: {(b.value / bankMax) * 100}%; background: color-mix(in srgb, {b.color} 16%, transparent); border: 1px solid {b.color}"></div>
							</div>
							<span class="w-14 shrink-0 text-right font-medium tabular-nums">{fmt(b.value)}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		{#if categoryBars.length}
			<div class="panel flex min-w-0 flex-col justify-center overflow-auto p-4 md:col-start-2 md:row-start-1">
				<h2 class="mb-2.5 flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-wider text-muted">By category <span class="text-[0.78em] font-medium normal-case">S/</span></h2>
				<PieChart items={categoryBars} {fmt} />
			</div>
		{/if}

		{#if trendPoints.length}
			<div class="panel flex min-w-0 flex-col justify-center overflow-auto p-4 md:col-start-1 md:row-start-2">
				<h2 class="mb-2.5 flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-wider text-muted">Daily spend <span class="text-[0.78em] font-medium normal-case">S/</span></h2>
				<DayBars points={trendPoints} transactions={data.transactions} {fmt} />
			</div>
		{/if}

		<section class="panel flex min-h-0 flex-col overflow-hidden p-4 md:col-start-1 md:row-start-3 md:min-h-0">
			<h2 class="mb-3 flex shrink-0 items-center justify-between text-[0.7rem] font-semibold uppercase tracking-wider text-muted">
				<span>Planner — best card<span class="hidden md:inline"> by day</span></span>
				<a href="/planner" class="normal-case text-accent no-underline hover:underline">details →</a>
			</h2>
			{#if data.cards?.length}
				<!-- Full month calendar on tablet+; a compact "today" card on phones. -->
				<div class="hidden min-h-0 flex-1 md:block">
					<FleetCalendar cards={data.cards} transactions={data.transactions} {fmt} />
				</div>
				{#if bestToday}
					<div class="flex flex-col gap-1.5 md:hidden">
						<div class="flex items-center gap-2 text-sm">
							<span class="h-[9px] w-[9px] shrink-0 rounded-full" style="background: {catColor(bestToday.card.bank)}"></span>
							💳 Charge <span class="font-semibold">{bestToday.card.name || bestToday.card.bank}</span> today
							<span class="text-accent">· {bestToday.runway}d</span>
						</div>
						<div class="text-xs text-muted">interest-free, bills {fmtD(bestToday.close)}</div>
						<a href="/planner" class="mt-1 text-xs text-accent no-underline hover:underline">Open full planner →</a>
					</div>
				{/if}
			{:else}
				<p class="text-sm text-muted">No cards yet. <a href="/cards" class="text-accent underline">Add one</a> to plan spending.</p>
			{/if}
		</section>

		<section class="panel flex min-h-0 flex-col overflow-hidden md:col-start-2 md:row-start-2 md:row-span-2">
			<div class="min-h-0 flex-1 overflow-auto">
			<table class="w-full border-collapse">
				<thead>
					<tr class="[&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:border-b [&>th]:border-border [&>th]:bg-surface [&>th]:px-4 [&>th]:py-2 [&>th]:text-left [&>th]:text-[0.68rem] [&>th]:font-semibold [&>th]:uppercase [&>th]:tracking-wide [&>th]:text-muted">
						<th>Date</th>
						<th>Merchant</th>
						<th>Bank</th>
						<th class="!text-right">Amount</th>
						<th>Category</th>
					</tr>
				</thead>
				<tbody class="[&>tr:last-child>td]:border-b-0">
					{#each data.transactions as t (t.dedupe_id)}
						<tr
							animate:flip={{ duration: ready ? 360 : 0 }}
							in:slide={{ duration: ready ? 420 : 0 }}
							out:slide={{ duration: ready ? 220 : 0 }}
							title={needsReview(t) ? `Needs review (${t.confidence} confidence)` : ''}
							class="align-middle text-sm transition-[background-color,box-shadow] duration-300 [&>td]:border-b [&>td]:border-border [&>td]:px-4 [&>td]:py-2 {justAdded.has(
								t.dedupe_id
							)
								? 'tx-new'
								: needsReview(t)
									? 'bg-warn-bg shadow-[inset_3px_0_0_var(--warn-border)]'
									: 'hover:bg-bg'}"
						>
							<td class="whitespace-nowrap text-muted">{fmtWhen(t.date, t.time)}</td>
							<td class="font-medium">{t.merchant_clean || t.merchant || '—'}</td>
							<td class="text-muted">{t.bank ?? ''}</td>
							<td class="text-right tabular-nums">
								<div class="font-semibold">{money(t.amount, t.currency)}</div>
								{#if isForeign(t.currency)}
									<div class="text-xs text-muted">≈ S/ {fmt(toPEN(t.amount, t.currency))}</div>
								{/if}
							</td>
							<td>
								{#if owner}
									<Select
										value={t.category ?? ''}
										options={data.categories}
										onChange={(v) => recategorize(t.dedupe_id, v)}
									/>
								{:else}
									<span class="inline-flex items-center gap-1.5 text-sm">
										<span class="h-2.5 w-2.5 rounded-full" style="border: 1.5px solid {catColor(t.category)}"></span>
										{catDisplay(t.category)}
									</span>
								{/if}
							</td>
						</tr>
					{:else}
						<tr><td colspan="5" class="px-4 py-3 text-center text-muted">No transactions.</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>
	</div>
</div>

<Modal bind:open={reviewOpen} title="Needs review">
	{#if flagged.length}
		<p class="mb-3 text-sm text-muted">
			Low/medium-confidence parses. Fix the category if wrong, then mark reviewed to clear the flag.
		</p>
		<ul class="m-0 flex list-none flex-col gap-2.5 p-0">
			{#each flagged as t (t.dedupe_id)}
				<li class="rounded-[10px] border border-border px-3.5 py-3">
					<div class="flex items-center justify-between gap-2">
						<span class="font-semibold">{t.merchant_clean || t.merchant || '—'}</span>
						<span
							class="rounded-full px-1.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide {t.confidence ===
							'low'
								? 'bg-[#fde2e1] text-[#b91c1c]'
								: 'border border-warn-border bg-warn-bg text-warn-text'}"
						>{t.confidence}</span>
					</div>
					<div class="mb-2.5 mt-1 text-xs text-muted">
						{fmtWhen(t.date, t.time)} · {t.bank ?? ''} ·
						<strong>{fmt(t.amount)} {t.currency ?? ''}</strong>
					</div>
					<div class="flex flex-wrap items-center justify-between gap-2">
						<Select
							value={t.category ?? ''}
							options={data.categories}
							onChange={(v) => recategorize(t.dedupe_id, v)}
						/>
						<button
							onclick={() => markReviewed(t.dedupe_id)}
							class="rounded-lg border border-border bg-accent px-2.5 py-2 font-semibold text-white transition hover:brightness-105"
						>✓ Mark reviewed</button>
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="mb-3 text-sm text-muted">All clear — nothing to review. 🎉</p>
	{/if}
</Modal>

<style>
	/* New row arrives via SSE: brief accent flash + left bar, then settles. */
	:global(tr.tx-new) {
		animation: tx-flash 2.2s ease-out;
	}
	@keyframes tx-flash {
		0% {
			background-color: color-mix(in srgb, var(--accent) 24%, transparent);
			box-shadow: inset 3px 0 0 var(--accent);
		}
		100% {
			background-color: transparent;
			box-shadow: inset 3px 0 0 transparent;
		}
	}
</style>
