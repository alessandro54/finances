<script lang="ts">
	import { fmtMoney, money, toPEN } from '$lib/format';
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

	// Green at/below median → red at the peak (max), smooth hue ramp in between.
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
</script>

{#if points.length}
	<div>
		<div class="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs text-muted">
			<span><span class="font-semibold text-text">{fmt(median)}</span> median/day</span>
			<span>· max {fmt(max)}</span>
			<span>· <span class="font-semibold text-text">{fmt(total)}</span> total</span>
		</div>
		<div class="relative flex h-40 items-end gap-px">
			{#each points as p (p.date)}
				<div class="group relative flex h-full flex-1 flex-col justify-end">
					<!-- hover tooltip: that day's merchants, biggest first -->
					<div
						class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 hidden w-48 -translate-x-1/2 rounded-lg border border-border bg-surface p-2 text-left shadow-[var(--shadow)] group-hover:block"
					>
						<div class="mb-1 flex justify-between gap-2 border-b border-border pb-1 text-xs font-semibold">
							<span>{p.date}</span><span class="tabular-nums">S/ {fmt(p.value)}</span>
						</div>
						{#each (byDay[p.date] ?? []).slice(0, 6) as t}
							<div class="flex justify-between gap-2 text-[0.72rem]">
								<span class="truncate text-muted">{t.merchant}</span>
								<span class="tabular-nums">{money(t.amount, t.currency)}</span>
							</div>
						{:else}
							<div class="text-[0.72rem] text-muted">No itemized transactions.</div>
						{/each}
						{#if (byDay[p.date] ?? []).length > 6}
							<div class="mt-0.5 text-[0.68rem] text-muted">
								+{(byDay[p.date] ?? []).length - 6} more
							</div>
						{/if}
					</div>
					<div
						class="min-h-px w-full rounded-t transition-[height] duration-300 hover:brightness-110"
						style="height: {p.value > 0 ? Math.max((p.value / max) * 100, 3) : 0}%; background: {barColor(p.value)}"
					></div>
				</div>
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
	</div>
{:else}
	<p class="m-0 text-sm text-muted">No data.</p>
{/if}
