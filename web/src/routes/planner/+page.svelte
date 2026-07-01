<script lang="ts">
	import CycleCalendar from '$lib/components/CycleCalendar.svelte';
	import FleetCalendar from '$lib/components/FleetCalendar.svelte';
	import { fmtMoney as fmt, money, toPEN, setRates } from '$lib/format';
	import { catColor } from '$lib/category';
	import { plan, simulate, cycleWindow, parseYMD, diffDays, ymd, todayLima } from '$lib/cycle';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	// svelte-ignore state_referenced_locally
	setRates(data.rates);

	const today = todayLima();
	const todayStr = ymd(today);

	// '' = fleet view (merge all cards). Default to it when there's more than one card.
	// svelte-ignore state_referenced_locally
	let selBank = $state(data.cards.length > 1 ? '' : (data.cards[0]?.bank ?? ''));
	const sel = $derived(data.cards.find((c) => c.bank === selBank) ?? null);
	const p = $derived(sel ? plan(sel, today) : null);

	// Fleet view: rank every card by the runway it gives if charged today, and
	// collapse the next 60 days into windows where one card is the best to charge.
	const ranking = $derived(
		[...data.cards]
			.map((c) => {
				const cw = cycleWindow(c, today);
				return { c, runway: diffDays(cw.end, today), close: cw.end };
			})
			.sort((a, b) => b.runway - a.runway)
	);
	const best = $derived(ranking[0] ?? null);
	const runnerGap = $derived(ranking.length > 1 ? ranking[0].runway - ranking[1].runway : 0);
	const cardName = (c: { name: string | null; bank: string }) => c.name || c.bank;

	// Past purchases that landed in the last 3 days of a cycle — waiting would have
	// pushed them to the next statement (a full cycle of extra runway).
	const advisories = $derived(
		sel
			? data.transactions
					.filter((t) => t.bank === sel.bank && t.date)
					.map((t) => {
						const d = parseYMD(t.date!);
						const cw = cycleWindow(sel, d);
						return { t, fl: diffDays(cw.end, d), len: diffDays(cw.end, cw.start), pen: toPEN(t.amount, t.currency) };
					})
					.filter((x) => x.fl >= 0 && x.fl <= 3)
					.sort((a, b) => b.pen - a.pen)
					.slice(0, 6)
			: []
	);

	// What-if simulator.
	let amount = $state(200);
	let simDate = $state(todayStr);
	const sim = $derived(sel ? simulate(sel, parseYMD(simDate)) : null);
	const alt = $derived(sel && sim ? simulate(sel, sim.cycle.end) : null); // buy at next cycle start instead
	const simGain = $derived(sim && alt ? alt.daysUntilClose - sim.daysUntilClose : 0);

	const fmtDate = (d: Date) =>
		d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
</script>

<div class="mb-4 flex flex-wrap items-end justify-between gap-4">
	<div>
		<h1 class="m-0 text-xl font-semibold tracking-tight">Planner</h1>
		<p class="mt-0.5 text-xs text-muted">Time purchases to your billing cycle for maximum interest-free runway.</p>
	</div>
	{#if data.cards.length}
		<select
			bind:value={selBank}
			class="rounded-[9px] border border-border bg-surface px-2.5 py-1.5 text-sm text-text"
		>
			{#if data.cards.length > 1}<option value="">⭐ All cards</option>{/if}
			{#each data.cards as c}
				<option value={c.bank}>{c.name || c.bank}{c.card_last4 ? ` ····${c.card_last4}` : ''}</option>
			{/each}
		</select>
	{/if}
</div>

{#if !data.cards.length}
	<div class="panel p-6 text-center text-muted">
		No cards with a billing cycle yet. <a href="/cards" class="font-semibold text-accent underline">Add one</a> to plan spending.
	</div>
{:else if !sel && best}
	<!-- Fleet view: which card to charge, and when the best card changes. -->
	<section class="panel mb-4 p-5">
		<h2 class="mb-2 text-[0.7rem] font-semibold uppercase tracking-wider text-muted">Charge this card now</h2>
		<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
			<span class="flex items-center gap-2 text-2xl font-bold">
				<span class="h-3 w-3 rounded-full" style="background: {catColor(best.c.bank)}"></span>
				{cardName(best.c)}
			</span>
			<span class="text-sm text-muted">bills {fmtDate(best.close)} · <span class="font-semibold text-text">{best.runway} days</span> interest-free</span>
		</div>
		{#if runnerGap > 0}
			<p class="mt-1 text-sm text-muted">+{runnerGap} days more runway than the next best card.</p>
		{/if}
	</section>

	<!-- Calendar: each day tinted by the best card to charge; color blocks are the windows. -->
	<section class="panel flex h-[72vh] min-h-[440px] flex-col p-4">
		<FleetCalendar cards={data.cards} transactions={data.transactions} {fmt} />
	</section>
{:else if sel && p}
	<div class="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
		<!-- Calendar heatmap -->
		<section class="panel p-4">
			<CycleCalendar card={sel} transactions={data.transactions} {fmt} />
		</section>

		<div class="flex flex-col gap-4">
			<!-- Spend-timing summary -->
			<section class="panel p-4">
				<h2 class="mb-3 text-[0.7rem] font-semibold uppercase tracking-wider text-muted">This cycle</h2>
				<div class="flex items-baseline gap-2">
					<span class="text-2xl font-bold tabular-nums">{p.daysLeft}</span>
					<span class="text-sm text-muted">days until the statement closes ({fmtDate(p.cur.end)})</span>
				</div>
				<div class="mt-3 rounded-lg border border-accent/40 bg-accent/5 p-3 text-sm">
					💡 <span class="font-semibold">Best day to spend: {fmtDate(p.bestDay)}</span>
					{#if p.daysToBest > 0}<span class="text-muted"> (in {p.daysToBest}d)</span>{/if}
					<div class="mt-1 text-muted">
						Waiting buys <span class="font-semibold text-text">+{p.gain} interest-free days</span> vs spending today.
					</div>
				</div>
				<div class="mt-3 grid grid-cols-2 gap-2 text-sm">
					<div class="rounded-lg border border-border p-2.5">
						<div class="text-xs text-muted">Spend today</div>
						<div class="font-semibold">bills {fmtDate(p.cur.end)}</div>
						<div class="tabular-nums text-muted">{p.floatNow}d runway</div>
					</div>
					<div class="rounded-lg border border-border p-2.5">
						<div class="text-xs text-muted">Spend {fmtDate(p.bestDay)}</div>
						<div class="font-semibold">bills {fmtDate(p.next.end)}</div>
						<div class="tabular-nums text-muted">{p.floatWait}d runway</div>
					</div>
				</div>
			</section>

			<!-- What-if simulator -->
			<section class="panel p-4">
				<h2 class="mb-3 text-[0.7rem] font-semibold uppercase tracking-wider text-muted">What if I spend…</h2>
				<div class="flex flex-wrap items-end gap-3">
					<label class="text-xs text-muted">
						Amount (S/)
						<input
							type="number"
							bind:value={amount}
							min="0"
							class="mt-1 block w-28 rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text"
						/>
					</label>
					<label class="text-xs text-muted">
						On
						<input
							type="date"
							bind:value={simDate}
							class="mt-1 block rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text"
						/>
					</label>
				</div>
				{#if sim && alt}
					<div class="mt-3 text-sm">
						<div>
							S/ {fmt(amount)} on {fmtDate(parseYMD(simDate))} →
							<span class="font-semibold">bills the statement closing {fmtDate(sim.closes)}</span>,
							<span class="tabular-nums">{sim.daysUntilClose}d</span> before it posts.
						</div>
						{#if simGain > 0}
							<div class="mt-2 rounded-lg border border-accent/40 bg-accent/5 p-2.5 text-muted">
								Wait until <span class="font-semibold text-text">{fmtDate(sim.cycle.end)}</span> →
								bills {fmtDate(alt.closes)},
								<span class="font-semibold text-text">+{simGain} days</span> of runway.
							</div>
						{:else}
							<div class="mt-2 text-xs text-muted">Already early in the cycle — good time to spend.</div>
						{/if}
					</div>
				{/if}
			</section>
		</div>
	</div>

	<!-- Advisory: purchases that could have been pushed to the next cycle -->
	<section class="panel mt-4 p-4">
		<h2 class="mb-3 text-[0.7rem] font-semibold uppercase tracking-wider text-muted">
			Landed late in a cycle
		</h2>
		{#if advisories.length}
			<p class="mb-3 text-xs text-muted">
				These posted in the last days before a statement closed. Spending them a little later would have
				pushed them to the next statement — roughly a full cycle of extra time to pay.
			</p>
			<ul class="m-0 flex list-none flex-col gap-2 p-0">
				{#each advisories as a (a.t.dedupe_id)}
					<li class="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm">
						<span class="min-w-0">
							<span class="font-medium">{a.t.merchant_clean || a.t.merchant || '—'}</span>
							<span class="text-muted"> · {a.t.date?.slice(5)}</span>
						</span>
						<span class="flex shrink-0 items-center gap-3">
							<span class="tabular-nums">{money(a.t.amount, a.t.currency)}</span>
							<span class="whitespace-nowrap rounded-full bg-warn-bg px-2 py-0.5 text-xs font-semibold text-warn-text">
								{a.fl}d before close · +{a.len}d if waited
							</span>
						</span>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="text-sm text-muted">Nothing landed near a cycle close. 👍</p>
		{/if}
	</section>
{/if}
