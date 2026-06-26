<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { catLabel, OTHERS } from '$lib/category';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	function fmt(n: number | null) {
		return (n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}

	function onMonth(e: Event) {
		const v = (e.target as HTMLInputElement).value; // 'YYYY-MM' or ''
		goto(v ? `/?month=${v}` : '/', { keepFocus: true });
	}
</script>

<div class="bar">
	<h1>Transactions</h1>
	<label>
		Month
		<input type="month" value={data.month} oninput={onMonth} />
	</label>
</div>

<section class="totals">
	{#each data.stats.by_currency as c}
		<div class="card">
			<div class="big">{fmt(c.total)} {c.currency}</div>
			<div class="muted">{c.count} tx</div>
		</div>
	{:else}
		<div class="muted">No transactions for this period.</div>
	{/each}
</section>

{#if data.stats.by_category.length}
	<section class="cats">
		<h2>By category</h2>
		<table>
			<tbody>
				{#each data.stats.by_category as c}
					<tr>
						<td>{catLabel(c.category)}</td>
						<td class="num">{fmt(c.total)} {c.currency}</td>
						<td class="muted num">{c.count}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>
{/if}

<section>
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
				<tr>
					<td class="muted">{t.date ?? ''}<br /><small>{t.time ?? ''}</small></td>
					<td>{t.merchant_clean || t.merchant || '—'}</td>
					<td class="muted">{t.bank ?? ''}</td>
					<td class="num">{fmt(t.amount)} {t.currency ?? ''}</td>
					<td>
						<form method="POST" action="?/recategorize" use:enhance>
							<input type="hidden" name="id" value={t.dedupe_id} />
							<select name="category" onchange={(e) => e.currentTarget.form?.requestSubmit()}>
								<option value="" selected={!t.category}>{OTHERS}</option>
								{#each data.categories as c}
									<option value={c} selected={t.category === c}>{c}</option>
								{/each}
							</select>
						</form>
					</td>
				</tr>
			{:else}
				<tr><td colspan="5" class="muted">No transactions.</td></tr>
			{/each}
		</tbody>
	</table>
</section>

<style>
	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}
	h1 {
		font-size: 1.25rem;
		margin: 0;
	}
	h2 {
		font-size: 0.95rem;
		margin: 0 0 0.5rem;
	}
	.totals {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		margin: 1rem 0;
	}
	.card {
		background: #fff;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		padding: 0.75rem 1rem;
		min-width: 140px;
	}
	.big {
		font-size: 1.3rem;
		font-weight: 600;
	}
	.muted {
		color: #888;
	}
	.cats {
		margin: 1rem 0;
		max-width: 420px;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		background: #fff;
	}
	.tx {
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		overflow: hidden;
	}
	th,
	td {
		text-align: left;
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid #f0f0f0;
		vertical-align: top;
	}
	th {
		background: #f7f7f7;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: #777;
	}
	.num {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	select {
		max-width: 160px;
	}
</style>
