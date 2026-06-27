<script lang="ts">
	type Item = { label: string; value: number; color: string };
	let { items, fmt }: { items: Item[]; fmt: (n: number) => string } = $props();

	const R = 60; // radius
	const SW = 24; // stroke width (donut thickness)
	const C = 2 * Math.PI * R;
	const total = $derived(items.reduce((s, i) => s + i.value, 0));

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
	<div class="pie">
		<svg viewBox="0 0 160 160" width="148" height="148" role="img" aria-label="Spend by category">
			<g transform="rotate(-90 80 80)">
				{#each slices as s (s.label)}
					<circle
						cx="80"
						cy="80"
						r={R}
						fill="none"
						stroke={s.color}
						stroke-width={SW}
						stroke-dasharray="{s.len} {C - s.len}"
						stroke-dashoffset={s.offset}
					/>
				{/each}
			</g>
			<text x="80" y="76" text-anchor="middle" class="c-label">Total</text>
			<text x="80" y="92" text-anchor="middle" class="c-total">{fmt(total)}</text>
		</svg>
		<ul class="legend">
			{#each slices as s (s.label)}
				<li>
					<span class="dot" style="background: {s.color}"></span>
					<span class="lbl" title={s.label}>{s.label}</span>
					<span class="pct">{Math.round(s.frac * 100)}%</span>
					<span class="val">{fmt(s.value)}</span>
				</li>
			{/each}
		</ul>
	</div>
{:else}
	<p class="empty">No data.</p>
{/if}

<style>
	.pie {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		flex-wrap: wrap;
	}
	svg {
		flex: none;
	}
	.c-label {
		font-size: 9px;
		fill: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.c-total {
		font-size: 13px;
		font-weight: 700;
		fill: var(--text);
	}
	.legend {
		flex: 1;
		min-width: 160px;
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.legend li {
		display: grid;
		grid-template-columns: auto 1fr auto auto;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8rem;
	}
	.dot {
		width: 9px;
		height: 9px;
		border-radius: 999px;
	}
	.lbl {
		color: var(--text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.pct {
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}
	.val {
		color: var(--text);
		font-variant-numeric: tabular-nums;
		font-weight: 500;
	}
	.empty {
		color: var(--text-muted);
		font-size: 0.85rem;
		margin: 0;
	}
</style>
