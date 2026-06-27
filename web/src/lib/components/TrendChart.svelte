<script lang="ts">
	type Point = { date: string; value: number };
	let {
		points,
		fmt,
		color = '#6366f1'
	}: { points: Point[]; fmt: (n: number) => string; color?: string } = $props();

	const W = 100;
	const H = 36;
	const max = $derived(Math.max(1, ...points.map((p) => p.value)));

	// x evenly spaced; y inverted (0 at top). Guard single-point case.
	function x(i: number) {
		return points.length <= 1 ? 0 : (i / (points.length - 1)) * W;
	}
	function y(v: number) {
		return H - (v / max) * (H - 4) - 2;
	}

	const line = $derived(points.map((p, i) => `${x(i)},${y(p.value)}`).join(' '));
	const area = $derived(
		points.length ? `0,${H} ${line} ${W},${H}` : ''
	);
	const total = $derived(points.reduce((s, p) => s + p.value, 0));
</script>

{#if points.length}
	<div class="wrap">
		<svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" role="img" aria-label="Spend trend">
			<defs>
				<linearGradient id="trendfill" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color={color} stop-opacity="0.28" />
					<stop offset="100%" stop-color={color} stop-opacity="0" />
				</linearGradient>
			</defs>
			<polygon points={area} fill="url(#trendfill)" />
			<polyline
				points={line}
				fill="none"
				stroke={color}
				stroke-width="1.2"
				stroke-linejoin="round"
				stroke-linecap="round"
				vector-effect="non-scaling-stroke"
			/>
		</svg>
		<div class="meta">
			<span>{points[0].date} → {points[points.length - 1].date}</span>
			<span class="total">{fmt(total)}</span>
		</div>
	</div>
{:else}
	<p class="empty">No data.</p>
{/if}

<style>
	.wrap {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	svg {
		width: 100%;
		height: 64px;
		display: block;
	}
	.meta {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
		color: var(--text-muted);
	}
	.total {
		font-variant-numeric: tabular-nums;
		color: var(--text);
		font-weight: 600;
	}
	.empty {
		color: var(--text-muted);
		font-size: 0.85rem;
		margin: 0;
	}
</style>
