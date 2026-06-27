<script lang="ts">
	import { fly, slide } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { onMount } from 'svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { catDisplay, catColor } from '$lib/category';
	import { fmtWhen, fmtMoney as fmt, money, toPEN, isForeign } from '$lib/format';
	import PieChart from '$lib/components/PieChart.svelte';
	import TrendChart from '$lib/components/TrendChart.svelte';
	import Select from '$lib/components/Select.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let reviewOpen = $state(false);

	// Animate row changes only after first paint (not the initial bulk load).
	let ready = $state(false);
	onMount(() => {
		ready = true;
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

	// Charts mix currencies poorly — focus on the currency with the largest total.
	const primary = $derived(
		[...data.stats.by_currency].sort((a, b) => b.total - a.total)[0]?.currency ?? 'PEN'
	);
	const categoryBars = $derived(
		(() => {
			// Fold null + "other" into a single Others slice.
			const map = new Map<string, { value: number; color: string }>();
			for (const c of data.stats.by_category.filter((c) => c.currency === primary)) {
				const label = catDisplay(c.category);
				const cur = map.get(label);
				if (cur) cur.value += c.total;
				else map.set(label, { value: c.total, color: catColor(c.category) });
			}
			return [...map.entries()]
				.map(([label, v]) => ({ label, value: v.value, color: v.color }))
				.sort((a, b) => b.value - a.value)
				.slice(0, 8);
		})()
	);
	const trendPoints = $derived(
		data.stats.by_day
			.filter((d) => d.currency === primary)
			.map((d) => ({ date: (d.date ?? '').slice(5), value: d.total }))
	);
</script>

<div class="mb-5 flex items-end justify-between gap-4">
	<div>
		<h1 class="m-0 text-[1.4rem] font-semibold tracking-tight">Transactions</h1>
		<p class="mt-0.5 text-sm text-muted">{data.month || 'All time'}</p>
	</div>
	<label>
		<input
			type="month"
			value={data.month}
			oninput={onMonth}
			class="rounded-[9px] border border-border bg-surface px-2.5 py-1.5 text-text"
		/>
	</label>
</div>

{#if flagged.length}
	<button
		onclick={() => (reviewOpen = true)}
		transition:slide={{ duration: 200 }}
		class="mb-4 flex w-full items-center justify-between gap-4 rounded-[10px] border border-warn-border bg-warn-bg px-4 py-2.5 text-left font-semibold text-warn-text"
	>
		<span class="flex items-center gap-2"><span>⚠</span>
			{flagged.length} transaction{flagged.length > 1 ? 's' : ''} need review</span>
		<span class="whitespace-nowrap">Review →</span>
	</button>
{/if}

<section class="mb-4 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]">
	{#each data.stats.by_currency as c}
		<div
			class="panel flex flex-col gap-0.5 p-5 transition-transform hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(16,18,27,0.08)]"
		>
			<span class="text-xs font-semibold tracking-wide text-accent">{c.currency}</span>
			<span class="text-[1.7rem] font-bold tabular-nums tracking-tight">{money(c.total, c.currency)}</span>
			{#if isForeign(c.currency)}
				<span class="text-xs text-muted">≈ S/ {fmt(toPEN(c.total, c.currency))}</span>
			{/if}
			<span class="text-muted">{c.count} transactions</span>
		</div>
	{:else}
		<div class="panel p-5"><p class="text-muted">No transactions for this period.</p></div>
	{/each}
</section>

{#if categoryBars.length || trendPoints.length}
	<section class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
		<div class="panel p-5 transition-transform hover:-translate-y-0.5">
			<h2 class="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
				By category <span class="text-[0.78em] font-medium normal-case">{primary}</span>
			</h2>
			<PieChart items={categoryBars} {fmt} />
		</div>
		<div class="panel p-5 transition-transform hover:-translate-y-0.5">
			<h2 class="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
				Daily spend <span class="text-[0.78em] font-medium normal-case">{primary}</span>
			</h2>
			<TrendChart points={trendPoints} {fmt} />
		</div>
	</section>
{/if}

<section class="panel overflow-hidden">
	<table class="w-full border-collapse">
		<thead>
			<tr class="[&>th]:border-b [&>th]:border-border [&>th]:bg-surface [&>th]:px-4 [&>th]:py-3 [&>th]:text-left [&>th]:text-xs [&>th]:font-semibold [&>th]:uppercase [&>th]:tracking-wide [&>th]:text-muted">
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
					animate:flip={{ duration: ready ? 320 : 0 }}
					in:fly={{ y: -12, duration: ready ? 280 : 0 }}
					out:slide={{ duration: ready ? 220 : 0 }}
					title={needsReview(t) ? `Needs review (${t.confidence} confidence)` : ''}
					class="align-middle transition-[background-color,box-shadow] duration-300 [&>td]:border-b [&>td]:border-border [&>td]:px-4 [&>td]:py-3 {needsReview(
						t
					)
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
						<Select
							value={t.category ?? ''}
							options={data.categories}
							onChange={(v) => recategorize(t.dedupe_id, v)}
						/>
					</td>
				</tr>
			{:else}
				<tr><td colspan="5" class="px-4 py-3 text-center text-muted">No transactions.</td></tr>
			{/each}
		</tbody>
	</table>
</section>

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
