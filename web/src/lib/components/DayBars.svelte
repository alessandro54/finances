<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, Svg, Bars, Bar, Axis, Grid, Highlight, Tooltip } from 'layerchart';
	import { scaleBand } from 'd3-scale';
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

	// Enrich each bar with its transactions so the tooltip can itemize the day.
	const data = $derived(points.map((p) => ({ ...p, rows: byDay[p.date] ?? [] })));

	// Bar color reacts to the median: at/below = green; above ramps yellow → red
	// by how far past the median it sits (relative to the peak day).
	function barColor(v: number): string {
		if (v <= median || max <= median) return '#0ecb81';
		const t = Math.min(1, (v - median) / (max - median));
		return `hsl(${Math.round(48 - 48 * t)} 88% 55%)`; // 48=yellow → 0=red
	}

	// Fixed, "nice" top of the axis so we can place the median line precisely.
	const niceMax = $derived(Math.max(100, Math.ceil(max / 100) * 100));
	// Plot geometry (must match the Chart padding + wrapper height below).
	const PAD_TOP = 4;
	const PAD_BOTTOM = 20;
	const PAD_LEFT = 36;
	const H = 160; // h-40
	const medianTop = $derived(PAD_TOP + (1 - median / niceMax) * (H - PAD_TOP - PAD_BOTTOM));

	// layerchart measures the DOM → render client-only so SSR and hydration agree.
	let mounted = $state(false);
	onMount(() => (mounted = true));

	// Compact soles: 1.2k, 460, 0 — keeps the y-axis narrow and legible.
	const compact = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v)));
	// Show ~6 date labels max so the axis doesn't crowd.
	const xTicks = (scale: { domain: () => string[] }) => {
		const dom = scale.domain();
		const stride = Math.max(1, Math.ceil(dom.length / 6));
		return dom.filter((_, i) => i % stride === 0);
	};
</script>

{#if points.length}
	<div class="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs font-light text-muted">
		<span><span class="font-medium text-text">{fmt(median)}</span> median/day</span>
		<span>· max {fmt(max)}</span>
		<span>· <span class="font-medium text-text">{fmt(total)}</span> total</span>
	</div>
	<div class="relative h-40 [&_text]:!fill-muted [&_text]:![font-size:0.62rem] [&_text]:!font-normal [&_text]:![stroke:none] [&_text]:[paint-order:fill] [&_line]:stroke-border/40">
		{#if mounted}
		<Chart
			{data}
			x="date"
			xScale={scaleBand().padding(0.3)}
			y="value"
			yDomain={[0, niceMax]}
			padding={{ left: PAD_LEFT, bottom: PAD_BOTTOM, top: PAD_TOP }}
			tooltip={{ mode: 'band' } as any}
		>
			<Svg>
				<Grid y />
				<Bars>
					{#each data as d (d.date)}
						<Bar data={d} radius={2} rounded="top" strokeWidth={0} fill={barColor(d.value)} />
					{/each}
				</Bars>
				<Axis placement="left" ticks={4} format={compact} />
				<Axis placement="bottom" ticks={xTicks} />
				<Highlight bar={{ class: 'fill-none stroke-current stroke-1 opacity-40' }} />
			</Svg>

			<Tooltip.Root>
				{#snippet children({ data: d }: { data: { date: string; value: number; rows: { merchant: string; amount: number | null; currency: string | null }[] } })}
					<div class="mb-1.5 flex justify-between gap-4 border-b border-border pb-1.5 text-sm font-semibold">
						<span>{d.date}</span><span class="tabular-nums">S/ {fmt(d.value)}</span>
					</div>
					{#each d.rows.slice(0, 8) as r}
						<div class="flex justify-between gap-3 py-0.5 text-sm">
							<span class="max-w-[10rem] truncate text-muted">{r.merchant}</span>
							<span class="tabular-nums">{money(r.amount, r.currency)}</span>
						</div>
					{:else}
						<div class="text-sm text-muted">No itemized transactions.</div>
					{/each}
					{#if d.rows.length > 8}
						<div class="mt-1 text-xs text-muted">+{d.rows.length - 8} more</div>
					{/if}
				{/snippet}
			</Tooltip.Root>
		</Chart>

		{#if median > 0}
			<!-- Median-per-day reference line (crypto price-line style) + tag. -->
			<div class="pointer-events-none absolute right-0" style="top: {medianTop}px; left: {PAD_LEFT}px">
				<div
					class="border-t-2 border-dashed"
					style="border-color: var(--accent-2); box-shadow: 0 0 10px color-mix(in srgb, var(--accent-2) 60%, transparent)"
				></div>
				<span
					class="absolute -top-2.5 right-0 rounded px-1.5 py-0.5 text-[0.58rem] font-semibold text-black"
					style="background: var(--accent-2)"
				>
					med {fmt(median)}
				</span>
			</div>
		{/if}
		{/if}
	</div>
{:else}
	<p class="m-0 text-sm text-muted">No data.</p>
{/if}
