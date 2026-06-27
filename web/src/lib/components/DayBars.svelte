<script lang="ts">
	type Point = { date: string; value: number };
	let { points, fmt }: { points: Point[]; fmt: (n: number) => string } = $props();

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
				<div
					class="min-h-px flex-1 rounded-t transition-[height] duration-300 hover:brightness-110"
					style="height: {p.value > 0 ? Math.max((p.value / max) * 100, 3) : 0}%; background: {barColor(p.value)}"
					title="{p.date}: {fmt(p.value)}"
				></div>
			{/each}
			{#if median > 0}
				<div
					class="pointer-events-none absolute inset-x-0 border-t border-dashed border-muted/70"
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
