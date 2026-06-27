<script lang="ts">
	import { slide } from 'svelte/transition';
	import { goto, invalidateAll } from '$app/navigation';
	import { catDisplay, catColor } from '$lib/category';
	import { fmtWhen, fmtMoney as fmt } from '$lib/format';
	import PieChart from '$lib/components/PieChart.svelte';
	import TrendChart from '$lib/components/TrendChart.svelte';
	import Select from '$lib/components/Select.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let reviewOpen = $state(false);

	// Rows reviewed/recategorized this session — un-highlight instantly, before the
	// server round-trip + reload catches up (the server also clears the flag for good).
	let reviewedLocal = $state<Record<string, boolean>>({});

	// Low/medium-confidence rows need a human look (unless already handled locally).
	const NEEDS = new Set(['low', 'medium']);
	const needsReview = (t: { confidence: string | null; dedupe_id: string }) =>
		!!t.confidence && NEEDS.has(t.confidence) && !reviewedLocal[t.dedupe_id];
	const flagged = $derived(data.transactions.filter(needsReview));

	function onMonth(e: Event) {
		const v = (e.target as HTMLInputElement).value; // 'YYYY-MM' or ''
		goto(v ? `/?month=${v}` : '/', { keepFocus: true });
	}

	// '' clears the category to Others (server sets NULL). Recategorizing also reviews it.
	async function recategorize(id: string, category: string) {
		reviewedLocal[id] = true; // optimistic un-highlight
		const fd = new FormData();
		fd.set('id', id);
		fd.set('category', category);
		await fetch('?/recategorize', { method: 'POST', body: fd });
		await invalidateAll();
	}

	// Clear the review flag (confidence → high).
	async function markReviewed(id: string) {
		reviewedLocal[id] = true; // optimistic un-highlight
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
		data.stats.by_category
			.filter((c) => c.currency === primary)
			.map((c) => ({ label: catDisplay(c.category), value: c.total, color: catColor(c.category) }))
			.sort((a, b) => b.value - a.value)
			.slice(0, 8)
	);

	const trendPoints = $derived(
		data.stats.by_day
			.filter((d) => d.currency === primary)
			.map((d) => ({ date: (d.date ?? '').slice(5), value: d.total }))
	);
</script>

<div class="bar">
	<div>
		<h1>Transactions</h1>
		<p class="sub">{data.month || 'All time'}</p>
	</div>
	<label class="month">
		<input type="month" value={data.month} oninput={onMonth} />
	</label>
</div>

{#if flagged.length}
	<button class="review-banner" onclick={() => (reviewOpen = true)} transition:slide={{ duration: 200 }}>
		<span class="rb-left">
			<span class="rb-icon">⚠</span>
			{flagged.length} transaction{flagged.length > 1 ? 's' : ''} need review
		</span>
		<span class="rb-cta">Review →</span>
	</button>
{/if}

<section class="totals">
	{#each data.stats.by_currency as c}
		<div class="card stat">
			<span class="k">{c.currency}</span>
			<span class="big">{fmt(c.total)}</span>
			<span class="muted">{c.count} transactions</span>
		</div>
	{:else}
		<div class="card"><p class="muted">No transactions for this period.</p></div>
	{/each}
</section>

{#if categoryBars.length || trendPoints.length}
	<section class="charts">
		<div class="card">
			<h2>By category <span class="cur">{primary}</span></h2>
			<PieChart items={categoryBars} {fmt} />
		</div>
		<div class="card">
			<h2>Daily spend <span class="cur">{primary}</span></h2>
			<TrendChart points={trendPoints} {fmt} />
		</div>
	</section>
{/if}

<section class="card table-card">
	<table class="tx">
		<thead>
			<tr>
				<th>Date</th>
				<th>Merchant</th>
				<th>Bank</th>
				<th class="num">Amount</th>
				<th>Category</th>
			</tr>
		</thead>
		<tbody>
			{#each data.transactions as t (t.dedupe_id)}
				<tr class:flagged={needsReview(t)} title={needsReview(t) ? `Needs review (${t.confidence} confidence)` : ''}>
					<td class="muted nowrap">{fmtWhen(t.date, t.time)}</td>
					<td class="merchant">{t.merchant_clean || t.merchant || '—'}</td>
					<td class="muted">{t.bank ?? ''}</td>
					<td class="num amount">{fmt(t.amount)} <span class="cur">{t.currency ?? ''}</span></td>
					<td>
						<Select
							value={t.category ?? ''}
							options={data.categories}
							onChange={(v) => recategorize(t.dedupe_id, v)}
						/>
					</td>
				</tr>
			{:else}
				<tr><td colspan="5" class="muted center">No transactions.</td></tr>
			{/each}
		</tbody>
	</table>
</section>

<Modal bind:open={reviewOpen} title="Needs review">
	{#if flagged.length}
		<p class="rv-hint">
			Low/medium-confidence parses. Fix the category if wrong, then mark reviewed to clear the flag.
		</p>
		<ul class="rv-list">
			{#each flagged as t (t.dedupe_id)}
				<li>
					<div class="rv-main">
						<span class="rv-merchant">{t.merchant_clean || t.merchant || '—'}</span>
						<span class="conf conf-{t.confidence}">{t.confidence}</span>
					</div>
					<div class="rv-meta">
						{fmtWhen(t.date, t.time)} · {t.bank ?? ''} · <strong>{fmt(t.amount)} {t.currency ?? ''}</strong>
					</div>
					<div class="rv-actions">
						<Select
							value={t.category ?? ''}
							options={data.categories}
							onChange={(v) => recategorize(t.dedupe_id, v)}
						/>
						<button class="rv-ok" onclick={() => markReviewed(t.dedupe_id)}>✓ Mark reviewed</button>
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="rv-hint">All clear — nothing to review. 🎉</p>
	{/if}
</Modal>

<style>
	.bar {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.25rem;
	}
	h1 {
		font-size: 1.4rem;
		margin: 0;
		letter-spacing: -0.02em;
	}
	.sub {
		margin: 0.1rem 0 0;
		color: var(--text-muted);
		font-size: 0.85rem;
	}
	.month input {
		padding: 0.45rem 0.7rem;
		border: 1px solid var(--border);
		border-radius: 9px;
		background: var(--surface);
		color: var(--text);
		font: inherit;
	}

	.card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		padding: 1.1rem 1.25rem;
		transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.15s ease,
			box-shadow 0.15s ease;
	}
	.stat:hover,
	.charts .card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 20px rgba(16, 18, 27, 0.08);
	}
	h2 {
		font-size: 0.78rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		margin: 0 0 0.85rem;
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.cur {
		color: var(--text-muted);
		font-size: 0.78em;
		font-weight: 500;
	}

	.totals {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
	}
	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
	.stat .k {
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		color: var(--accent);
	}
	.big {
		font-size: 1.7rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		font-variant-numeric: tabular-nums;
	}

	.charts {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 1rem;
	}
	@media (max-width: 720px) {
		.charts {
			grid-template-columns: 1fr;
		}
	}

	.table-card {
		padding: 0;
		overflow: hidden;
	}
	table {
		width: 100%;
		border-collapse: collapse;
	}
	th,
	td {
		text-align: left;
		padding: 0.7rem 1rem;
		border-bottom: 1px solid var(--border);
		vertical-align: middle;
	}
	tbody tr:last-child td {
		border-bottom: none;
	}
	tbody tr {
		transition: background-color 0.35s ease, box-shadow 0.35s ease;
	}
	tbody tr:hover {
		background: var(--bg);
	}
	th {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-muted);
		font-weight: 600;
		background: var(--surface);
	}
	.merchant {
		font-weight: 500;
	}
	.muted {
		color: var(--text-muted);
	}
	.nowrap {
		white-space: nowrap;
	}
	.center {
		text-align: center;
	}
	.num {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	.amount {
		font-weight: 600;
	}

	/* review banner */
	.review-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		gap: 1rem;
		margin-bottom: 1rem;
		padding: 0.7rem 1rem;
		background: var(--warn-bg);
		border: 1px solid var(--warn-border);
		border-radius: 10px;
		color: var(--warn-text);
		font: inherit;
		font-weight: 600;
		cursor: pointer;
		text-align: left;
	}
	.review-banner:hover {
		filter: brightness(0.99);
	}
	.rb-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.rb-icon {
		font-size: 1rem;
	}
	.rb-cta {
		white-space: nowrap;
	}

	/* flagged rows */
	tbody tr.flagged {
		background: var(--warn-bg);
		box-shadow: inset 3px 0 0 var(--warn-border);
	}
	tbody tr.flagged:hover {
		background: var(--warn-bg);
	}

	/* review modal */
	.rv-hint {
		margin: 0 0 0.85rem;
		color: var(--text-muted);
		font-size: 0.85rem;
	}
	.rv-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.rv-list li {
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 0.7rem 0.85rem;
	}
	.rv-main {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.rv-merchant {
		font-weight: 600;
	}
	.rv-meta {
		color: var(--text-muted);
		font-size: 0.8rem;
		margin: 0.15rem 0 0.6rem;
	}
	.rv-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.rv-ok {
		padding: 0.4rem 0.7rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--accent);
		color: #fff;
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}
	.rv-ok:hover {
		filter: brightness(1.05);
	}
	.conf {
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 0.1rem 0.45rem;
		border-radius: 999px;
	}
	.conf-low {
		background: #fde2e1;
		color: #b91c1c;
	}
	.conf-medium {
		background: var(--warn-bg);
		color: var(--warn-text);
		border: 1px solid var(--warn-border);
	}
</style>
