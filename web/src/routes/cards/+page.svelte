<script lang="ts">
	import { enhance } from '$app/forms';
	import { catColor, catDisplay, isOthers } from '$lib/category';
	import { fmtMoney as fmt } from '$lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const cats = $derived(data.categories.filter((c) => !isOthers(c)));
	let newMode = $state<'monthly' | 'days'>('monthly');
</script>

<div class="mb-5 flex flex-wrap items-end justify-between gap-4">
	<div>
		<h1 class="m-0 text-[1.4rem] font-semibold tracking-tight">Cards</h1>
		<p class="mt-0.5 text-sm text-muted">{data.cards.length} card{data.cards.length === 1 ? '' : 's'} · budgets run per billing cycle</p>
	</div>
</div>

<!-- Add / edit a card (upsert by bank) -->
<form
	method="POST"
	action="?/saveCard"
	use:enhance
	class="panel mb-6 flex flex-wrap items-end gap-3 p-4"
>
	<label class="flex flex-col gap-1 text-xs text-muted">
		Bank
		<input name="bank" placeholder="BBVA" required class="w-32 rounded-[9px] border border-border bg-surface px-2.5 py-1.5 text-sm text-text" />
	</label>
	<label class="flex flex-col gap-1 text-xs text-muted">
		Name
		<input name="name" placeholder="BBVA Visa" class="w-44 rounded-[9px] border border-border bg-surface px-2.5 py-1.5 text-sm text-text" />
	</label>
	<label class="flex flex-col gap-1 text-xs text-muted">
		Last 4
		<input name="card_last4" placeholder="1234" maxlength="4" class="w-20 rounded-[9px] border border-border bg-surface px-2.5 py-1.5 text-sm text-text" />
	</label>
	<label class="flex flex-col gap-1 text-xs text-muted">
		Cycle
		<select name="cycle_type" bind:value={newMode} class="rounded-[9px] border border-border bg-surface px-2.5 py-1.5 text-sm text-text">
			<option value="monthly">Day of month</option>
			<option value="days">Every N days</option>
		</select>
	</label>
	{#if newMode === 'monthly'}
		<label class="flex flex-col gap-1 text-xs text-muted">
			Day
			<input name="cycle_start_day" type="number" min="1" max="28" value="1" class="w-20 rounded-[9px] border border-border bg-surface px-2.5 py-1.5 text-sm text-text" />
		</label>
	{:else}
		<label class="flex flex-col gap-1 text-xs text-muted">
			Length (days)
			<input name="cycle_length_days" type="number" min="1" value="30" class="w-24 rounded-[9px] border border-border bg-surface px-2.5 py-1.5 text-sm text-text" />
		</label>
		<label class="flex flex-col gap-1 text-xs text-muted">
			Last close date
			<input name="cycle_anchor" type="date" class="rounded-[9px] border border-border bg-surface px-2.5 py-1.5 text-sm text-text" />
		</label>
	{/if}
	<button type="submit" class="cursor-pointer rounded-[9px] bg-accent px-4 py-2 text-sm font-semibold text-white hover:brightness-105">Save card</button>
</form>

<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
	{#each data.cards as card (card.bank)}
		{@const st = data.status[card.bank]}
		<section class="panel p-5">
			<div class="mb-3 flex items-start justify-between gap-3">
				<div>
					<div class="text-base font-semibold">{card.name || card.bank}</div>
					<div class="mt-0.5 flex items-center gap-2 text-xs text-muted">
						<span>{card.bank}</span>
						{#if card.card_last4}<span>·</span><span>•••• {card.card_last4}</span>{/if}
						<span>·</span>
						{#if card.cycle_type === 'days'}
							<form method="POST" action="?/saveCard" use:enhance class="inline-flex items-center gap-1">
								<input type="hidden" name="bank" value={card.bank} />
								<input type="hidden" name="name" value={card.name ?? ''} />
								<input type="hidden" name="card_last4" value={card.card_last4 ?? ''} />
								<input type="hidden" name="cycle_type" value="days" />
								<span>every</span>
								<input
									name="cycle_length_days"
									type="number"
									min="1"
									value={card.cycle_length_days ?? 30}
									onchange={(e) => e.currentTarget.form?.requestSubmit()}
									class="w-12 rounded border border-border bg-surface px-1.5 py-0.5 text-center text-xs tabular-nums text-text"
								/>
								<span>days from</span>
								<input
									name="cycle_anchor"
									type="date"
									value={card.cycle_anchor ?? ''}
									onchange={(e) => e.currentTarget.form?.requestSubmit()}
									class="rounded border border-border bg-surface px-1.5 py-0.5 text-xs text-text"
								/>
							</form>
						{:else}
							<form method="POST" action="?/saveCard" use:enhance class="inline-flex items-center gap-1">
								<input type="hidden" name="bank" value={card.bank} />
								<input type="hidden" name="name" value={card.name ?? ''} />
								<input type="hidden" name="card_last4" value={card.card_last4 ?? ''} />
								<input type="hidden" name="cycle_type" value="monthly" />
								<span>cycle day</span>
								<input
									name="cycle_start_day"
									type="number"
									min="1"
									max="28"
									value={card.cycle_start_day}
									onchange={(e) => e.currentTarget.form?.requestSubmit()}
									class="w-12 rounded border border-border bg-surface px-1.5 py-0.5 text-center text-xs tabular-nums text-text"
								/>
							</form>
						{/if}
					</div>
				</div>
				<form
					method="POST"
					action="?/deleteCard"
					use:enhance
					onsubmit={(e) => {
						if (!confirm(`Delete card "${card.bank}" and its budgets?`)) e.preventDefault();
					}}
				>
					<input type="hidden" name="bank" value={card.bank} />
					<button type="submit" class="cursor-pointer rounded-md border border-[#f0c4c4] bg-transparent px-2 py-1 text-xs font-medium text-[#dc2626] hover:bg-[#fef2f2]">Delete</button>
				</form>
			</div>

			{#if st?.cycle_start}
				<div class="mb-3 text-xs text-muted">
					Current cycle: <span class="font-medium text-text">{st.cycle_start} → {st.cycle_end}</span>
				</div>
			{/if}

			<!-- budget bars -->
			{#if st?.budgets?.length}
				<div class="mb-4 flex flex-col gap-2.5">
					{#each st.budgets as b (b.category + b.currency)}
						<div>
							<div class="mb-1 flex items-center justify-between gap-2 text-sm">
								<span class="flex items-center gap-2">
									<span class="h-[9px] w-[9px] rounded-full" style="background: {catColor(b.category)}"></span>
									{catDisplay(b.category)}
								</span>
								<span class="tabular-nums {b.over ? 'font-semibold text-[#dc2626]' : 'text-muted'}">
									{fmt(b.spent)} / {fmt(b.limit)} {b.currency}
								</span>
							</div>
							<div class="h-2 overflow-hidden rounded-full bg-track">
								<div
									class="h-full rounded-full transition-[width] duration-500"
									style="width: {Math.min(b.pct, 100)}%; background: {b.over ? '#dc2626' : catColor(b.category)}"
								></div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="mb-4 text-sm text-muted">No budgets yet for this card.</p>
			{/if}

			<!-- add / set a budget -->
			<form method="POST" action="?/saveBudget" use:enhance class="flex flex-wrap items-center gap-2 border-t border-border pt-3">
				<input type="hidden" name="card" value={card.bank} />
				<select name="category" class="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text">
					{#each cats as c}<option value={c}>{catDisplay(c)}</option>{/each}
				</select>
				<select name="currency" class="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text">
					<option>PEN</option>
					<option>USD</option>
					<option>EUR</option>
				</select>
				<input name="cycle_limit" type="number" step="0.01" min="0" placeholder="Limit" required class="w-24 rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text" />
				<button type="submit" class="cursor-pointer rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:brightness-105">Set budget</button>
			</form>
		</section>
	{:else}
		<div class="panel p-5 text-muted">No cards yet — add one above (one per bank).</div>
	{/each}
</div>
