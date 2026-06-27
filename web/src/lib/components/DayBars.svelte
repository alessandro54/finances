<script lang="ts">
	import { money, toPEN } from '$lib/format';
	import type { Transaction } from '$lib/types';

	type Point = { date: string; value: number };
	let {
		points,
		transactions = [],
		fmt
	}: { points: Point[]; transactions?: Transaction[]; fmt: (n: number) => string } = $props();

	const max = $derived(Math.max(1, ...points.map((p) => p.value)));
	const total = $derived(points.reduce((s, p) => s + p.value, 0));
	const median = $derived(
		(() => {
			const v = points.map((p) => p.value).sort((a, b) => a - b);
			if (!v.length) return 0;
			const m = Math.floor(v.length / 2);
			return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
		})()
	);

	function barColor(v: number): string {
		if (v <= median) return 'hsl(150 55% 45%)';
		const t = max > median ? (v - median) / (max - median) : 1;
		return `hsl(${Math.round(150 * (1 - t))} 72% 48%)`;
	}

	// 'MM-DD' → that day's transactions, biggest first (by soles).
	const byDay = $derived(
		(() => {
			const m: Record<string, { merchant: string; amount: number | null; currency: string | null; pen: number }[]> = {};
			for (const t of transactions) {
				const day = (t.date ?? '').slice(5);
				if (!day) continue;
				(m[day] ??= []).push({
					merchant: t.merchant_clean || t.merchant || '—',
					amount: t.amount,
					currency: t.currency,
					pen: toPEN(t.amount, t.currency)
				});
			}
			for (const k in m) m[k].sort((a, b) => b.pen - a.pen);
			return m;
		})()
	);

	// cursor-following tooltip — coords are RELATIVE to the chart container
	// (a `fixed` tooltip breaks: the panel's transition-transform makes it a
	// containing block, so viewport coords don't apply). absolute it is.
	let hovered = $state<string | null>(null);
	let mx = $state(0);
	let my = $state(0);
	let boxW = $state(600);
	const TW = 256; // tooltip width (w-64)
	const left = $derived(Math.max(0, Math.min(mx + 16, boxW - TW)));
	const hoveredValue = $derived(hovered ? (points.find((p) => p.date === hovered)?.value ?? 0) : 0);
	const hoveredRows = $derived(hovered ? (byDay[hovered] ?? []) : []);

	function track(e: MouseEvent) {
		const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
		boxW = r.width;
		mx = e.clientX - r.left;
		my = e.clientY - r.top;
	}
</script>

{#if points.length}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="relative" onmousemove={track} onmouseleave={() => (hovered = null)}>
		<div class="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs text-muted">
			<span><span class="font-semibold text-text">{fmt(median)}</span> median/day</span>
			<span>· max {fmt(max)}</span>
			<span>· <span class="font-semibold text-text">{fmt(total)}</span> total</span>
		</div>
		<div class="relative flex h-40 items-end gap-px">
			{#each points as p (p.date)}
				<div
					class="min-h-px flex-1 rounded-t transition-[height] duration-300 hover:brightness-110"
					style="height: {p.value > 0 ? Math.max((p.value / max) * 100, 3) : 0}%; background: {barColor(p.value)}"
					onmouseenter={() => (hovered = p.date)}
					role="presentation"
				></div>
			{/each}
			{#if median > 0}
				<div
					class="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-muted/70"
					style="bottom: {(median / max) * 100}%"
				>
					<span class="absolute right-0 -top-3.5 bg-surface px-1 text-[0.65rem] text-muted">median</span>
				</div>
			{/if}
		</div>
		<div class="mt-1 flex justify-between text-[0.7rem] text-muted">
			<span>{points[0].date}</span>
			<span>{points[points.length - 1].date}</span>
		</div>

		{#if hovered}
		<div
			class="pointer-events-none absolute z-50 w-64 rounded-xl border border-border bg-surface p-3 text-left shadow-[0_8px_30px_rgba(0,0,0,0.18)]"
			style="left: {left}px; top: {my + 16}px"
		>
			<div class="mb-1.5 flex justify-between gap-3 border-b border-border pb-1.5 text-sm font-semibold">
				<span>{hovered}</span><span class="tabular-nums">S/ {fmt(hoveredValue)}</span>
			</div>
			{#each hoveredRows.slice(0, 8) as t}
				<div class="flex justify-between gap-3 py-0.5 text-sm">
					<span class="truncate text-muted">{t.merchant}</span>
					<span class="tabular-nums">{money(t.amount, t.currency)}</span>
				</div>
			{:else}
				<div class="text-sm text-muted">No itemized transactions.</div>
			{/each}
			{#if hoveredRows.length > 8}
				<div class="mt-1 text-xs text-muted">+{hoveredRows.length - 8} more</div>
			{/if}
		</div>
		{/if}
	</div>
{:else}
	<p class="m-0 text-sm text-muted">No data.</p>
{/if}
