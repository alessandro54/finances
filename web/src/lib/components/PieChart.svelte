<script lang="ts">
	type Item = { label: string; value: number; color: string };
	let { items, fmt }: { items: Item[]; fmt: (n: number) => string } = $props();

	const R = 60; // radius
	const SW = 24; // stroke width (donut thickness)
	const C = 2 * Math.PI * R;
	const total = $derived(items.reduce((s, i) => s + i.value, 0));

	let hovered = $state<number | null>(null);
	const active = $derived(hovered !== null ? items[hovered] : null);

	// Each slice: stroke-dasharray segment on a circle, offset by running total.
	const slices = $derived(
		(() => {
			let acc = 0;
			return items.map((it) => {
				const frac = total > 0 ? it.value / total : 0;
				const seg = { ...it, frac, len: frac * C, offset: -acc * C };
				acc += frac;
				return seg;
			});
		})()
	);
</script>

{#if total > 0}
	<div class="flex flex-wrap items-center gap-5">
		<svg
			class="shrink-0"
			viewBox="0 0 160 160"
			width="148"
			height="148"
			role="img"
			aria-label="Spend by category"
		>
			<g transform="rotate(-90 80 80)">
				{#each slices as s, i (s.label)}
					<circle
						cx="80"
						cy="80"
						r={R}
						fill="none"
						stroke={s.color}
						stroke-width={hovered === i ? SW + 4 : SW}
						stroke-dasharray="{s.len} {C - s.len}"
						stroke-dashoffset={s.offset}
						opacity={hovered === null || hovered === i ? 1 : 0.4}
						class="cursor-pointer transition-[opacity,stroke-width] duration-150"
						role="presentation"
						onpointerenter={() => (hovered = i)}
						onpointerleave={() => (hovered = null)}
					/>
				{/each}
			</g>
			<text x="80" y="76" text-anchor="middle" class="fill-muted uppercase [font-size:9px] [letter-spacing:0.05em]">
				{active ? active.label : 'Total'}
			</text>
			<text x="80" y="92" text-anchor="middle" class="fill-text font-bold [font-size:13px]">
				{fmt(active ? active.value : total)}
			</text>
		</svg>
		<ul class="m-0 flex min-w-[160px] flex-1 list-none flex-col gap-1.5 p-0">
			{#each slices as s, i (s.label)}
				<li
					class="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 rounded px-1 py-0.5 text-sm transition-colors {hovered ===
					i
						? 'bg-track'
						: ''}"
					onpointerenter={() => (hovered = i)}
					onpointerleave={() => (hovered = null)}
				>
					<span class="h-[9px] w-[9px] rounded-full" style="background: {s.color}"></span>
					<span class="truncate text-text" title={s.label}>{s.label}</span>
					<span class="tabular-nums text-muted">{Math.round(s.frac * 100)}%</span>
					<span class="font-medium tabular-nums text-text">{fmt(s.value)}</span>
				</li>
			{/each}
		</ul>
	</div>
{:else}
	<p class="m-0 text-sm text-muted">No data.</p>
{/if}
