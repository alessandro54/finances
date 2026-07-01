<script lang="ts">
	import { catColor } from '$lib/category';
	import { money, toPEN } from '$lib/format';
	import { bestCardOn, bestCardWindows, addDays, diffDays, ymd, todayLima } from '$lib/cycle';
	import type { Card, Transaction } from '$lib/types';

	let {
		cards,
		transactions,
		fmt
	}: { cards: Card[]; transactions: Transaction[]; fmt: (n: number) => string } = $props();

	const today = todayLima();

	const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

	// Spend + itemized transactions per day, across every card.
	type Row = { merchant: string; amount: number | null; currency: string | null; bank: string | null; pen: number };
	const spendMap = $derived(
		(() => {
			const m = new Map<string, { pen: number; rows: Row[] }>();
			for (const t of transactions) {
				if (!t.date) continue;
				const k = t.date.slice(0, 10);
				const cur = m.get(k) ?? { pen: 0, rows: [] };
				const pen = toPEN(t.amount, t.currency);
				cur.pen += pen;
				cur.rows.push({
					merchant: t.merchant_clean || t.merchant || '—',
					amount: t.amount,
					currency: t.currency,
					bank: t.bank,
					pen
				});
				m.set(k, cur);
			}
			for (const v of m.values()) v.rows.sort((a, b) => b.pen - a.pen);
			return m;
		})()
	);
	const maxSpend = $derived(Math.max(1, ...[...spendMap.values()].map((v) => v.pen)));

	// Median daily spend over the visible window — the baseline the arrows compare against.
	const monthMedian = $derived(
		(() => {
			const lo = ymd(addDays(today, -15));
			const hi = ymd(addDays(today, 15));
			const vals: number[] = [];
			for (const [k, v] of spendMap) {
				if (k >= lo && k <= hi && v.pen > 0) vals.push(v.pen);
			}
			if (!vals.length) return 0;
			vals.sort((a, b) => a - b);
			const m = Math.floor(vals.length / 2);
			return vals.length % 2 ? vals[m] : (vals[m - 1] + vals[m]) / 2;
		})()
	);
	// How far above the median a day's spend is → 0–3 up-arrows (3 = red-flag day).
	function arrowLevel(spend: number): number {
		if (monthMedian <= 0 || spend <= monthMedian) return 0;
		const r = spend / monthMedian;
		return r >= 3 ? 3 : r >= 2 ? 2 : 1;
	}
	const ARROW_COLOR = ['', '#f0b90b', '#ff8a4c', 'var(--down)'];

	// Scan from 15 days back to 30 ahead: the back-scan lets the current window
	// show its real start (often in the past), the forward-scan plans upcoming ones.
	const windows = $derived(bestCardWindows(cards, addDays(today, -15), 46));
	// Best window to actually spend in = longest runway among windows not yet over.
	const bestWin = $derived(
		(() => {
			const live = windows.filter((w) => w.end >= today);
			return live.length ? live.reduce((a, b) => (b.startRunway > a.startRunway ? b : a)) : null;
		})()
	);
	// Lowest runway within the best window (its last day).
	const bestWinMin = $derived(bestWin ? bestWin.startRunway - diffDays(bestWin.end, bestWin.start) : 0);
	// Paint best-window days by runway: most runway = green → shrinking = red.
	function bestPaint(runway: number): string {
		if (!bestWin) return 'transparent';
		const range = bestWin.startRunway - bestWinMin;
		const g = range > 0 ? (runway - bestWinMin) / range : 1;
		const hue = Math.round(140 * Math.max(0, Math.min(1, g))); // 0=red → 140=green
		return `hsl(${hue} 72% 46% / 0.6)`;
	}

	// Green (low spend) → red (peak spend) heat for the day's total.
	function heat(pen: number): string {
		if (pen <= 0) return 'transparent';
		const t = pen / maxSpend;
		const hue = Math.round(150 * (1 - t)); // 150=green → 0=red
		return `hsl(${hue} 70% 46% / ${(0.07 + 0.28 * t).toFixed(2)})`;
	}

	// Rolling window: 15 days back → 15 days ahead, aligned to whole weeks.
	const rangeStart = addDays(today, -15);
	const rangeEnd = addDays(today, 15);
	const gridStart = addDays(rangeStart, -((rangeStart.getUTCDay() + 6) % 7)); // Monday on/before
	const gridEnd = addDays(rangeEnd, 6 - ((rangeEnd.getUTCDay() + 6) % 7)); // Sunday on/after
	const nCells = diffDays(gridEnd, gridStart) + 1;
	const rows = Math.ceil(nCells / 7);

	const cells = $derived(
		(() => {
			const out = [];
			for (let i = 0; i < nCells; i++) {
				const d = addDays(gridStart, i);
				const key = ymd(d);
				const pick = bestCardOn(cards, d)!;
				const prev = bestCardOn(cards, addDays(d, -1))!;
				const s = spendMap.get(key);
				const spend = s?.pen ?? 0;
				out.push({
					key,
					day: d.getUTCDate(),
					inRange: d >= rangeStart && d <= rangeEnd,
					bank: pick.card.bank,
					name: pick.card.name || pick.card.bank,
					runway: pick.runway,
					opens: prev.card.bank !== pick.card.bank,
					spend,
					count: s?.rows.length ?? 0,
					level: arrowLevel(spend),
					isToday: key === ymd(today),
					inBest: !!bestWin && d >= bestWin.start && d <= bestWin.end,
					isBestStart: !!bestWin && key === ymd(bestWin.start)
				});
			}
			return out;
		})()
	);

	const fmtShort = (d: Date) =>
		d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
	const rangeLabel = `${fmtShort(rangeStart)} – ${fmtShort(rangeEnd)}`;

	// Cursor-following tooltip (coords relative to the grid container).
	let hovered = $state<string | null>(null);
	let mx = $state(0);
	let my = $state(0);
	let boxW = $state(600);
	const TW = 260;
	const left = $derived(Math.max(0, Math.min(mx + 14, boxW - TW)));
	const hoveredRows = $derived(hovered ? (spendMap.get(hovered)?.rows ?? []) : []);
	const hoveredTotal = $derived(hovered ? (spendMap.get(hovered)?.pen ?? 0) : 0);
	function track(e: MouseEvent) {
		const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
		boxW = r.width;
		mx = e.clientX - r.left;
		my = e.clientY - r.top;
	}
</script>

<div class="flex h-full flex-col">
<div class="flex shrink-0 items-center justify-between gap-3">
	<h2 class="text-sm font-semibold">Next 15 days</h2>
	<span class="text-xs text-muted">{rangeLabel}</span>
</div>

<div class="mt-3 grid shrink-0 grid-cols-7 gap-1 text-center text-[0.65rem] font-semibold uppercase tracking-wide text-muted">
	{#each WEEKDAYS as w}<span>{w}</span>{/each}
</div>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="relative mt-1 flex min-h-0 flex-1 flex-col" onmousemove={track} onmouseleave={() => (hovered = null)}>
	<div class="grid min-h-0 flex-1 grid-cols-7 gap-1" style="grid-template-rows: repeat({rows}, minmax(0, 1fr))">
		{#each cells as c (c.key)}
			<div
				role="presentation"
				onmouseenter={() => (hovered = c.count ? c.key : null)}
				class="relative flex min-h-0 flex-col overflow-hidden rounded-md border p-1.5 text-xs transition-colors {c.inRange
					? ''
					: 'opacity-25'} {c.level >= 3
					? 'border-transparent ring-2 ring-[hsl(8_82%_56%)]'
					: c.isToday
						? 'border-accent'
						: 'border-border/40'}"
				style="background: {c.inBest ? bestPaint(c.runway) : heat(c.spend)}"
			>
				<div class="flex items-center justify-between">
					<span class={c.isToday ? 'grid h-5 w-5 place-items-center rounded-full bg-accent text-[0.7rem] font-bold text-white' : 'font-medium'}>{c.day}</span>
					{#if c.isBestStart}<span title="Best window to spend">⭐</span>{/if}
				</div>
				{#if c.spend > 0}
					<div class="mt-auto flex items-center justify-between gap-1">
						<span class="truncate text-[0.62rem] font-semibold tabular-nums">{fmt(c.spend)}</span>
						{#if c.level > 0}
							<span
								class="flex shrink-0 flex-col items-center leading-[0.5]"
								style="color: {ARROW_COLOR[c.level]}"
								title="{c.level}× above the {fmt(monthMedian)} median day"
							>
								{#each Array(c.level) as _, i (i)}<span class="text-[0.62rem] font-bold">⌃</span>{/each}
							</span>
						{/if}
					</div>
				{/if}
				{#if c.opens}<div class="absolute inset-y-1 left-0 w-[3px] rounded-full" style="background: {catColor(c.bank)}"></div>{/if}
			</div>
		{/each}
	</div>

	{#if hovered}
		<div
			class="pointer-events-none absolute z-50 w-[260px] rounded-xl border border-border bg-surface p-3 text-left shadow-[0_8px_30px_rgba(0,0,0,0.18)]"
			style="left: {left}px; top: {my + 14}px"
		>
			<div class="mb-1.5 flex justify-between gap-3 border-b border-border pb-1.5 text-sm font-semibold">
				<span>{hovered}</span><span class="tabular-nums">S/ {fmt(hoveredTotal)}</span>
			</div>
			{#each hoveredRows.slice(0, 8) as r}
				<div class="flex justify-between gap-3 py-0.5 text-sm">
					<span class="min-w-0 truncate text-muted">{r.merchant}<span class="text-[0.7em]"> · {r.bank ?? ''}</span></span>
					<span class="shrink-0 tabular-nums">{money(r.amount, r.currency)}</span>
				</div>
			{/each}
			{#if hoveredRows.length > 8}<div class="mt-1 text-xs text-muted">+{hoveredRows.length - 8} more</div>{/if}
		</div>
	{/if}
</div>

<div class="mt-3 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.72rem]">
	<span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded" style="background: hsl(150 68% 45% / 0.5)"></span> low → <span class="h-3 w-3 rounded" style="background: hsl(0 68% 45% / 0.6)"></span> high spend</span>
	<span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded" style="background: linear-gradient(90deg, hsl(140 72% 46% / 0.7), hsl(0 72% 46% / 0.7))"></span> ⭐ best window (green→red = runway)</span>
	<span class="flex items-center gap-1.5"><span class="flex flex-col leading-[0.5]" style="color: {ARROW_COLOR[3]}"><span>⌃</span><span>⌃</span><span>⌃</span></span> ≥3× median day</span>
	{#each cards as c (c.bank)}
		<span class="flex items-center gap-1.5"><span class="h-3 w-[3px] rounded-full" style="background: {catColor(c.bank)}"></span> {c.name || c.bank}</span>
	{/each}
</div>
</div>
