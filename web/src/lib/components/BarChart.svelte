<script lang="ts">
	type Item = { label: string; value: number; color: string };
	let { items, fmt }: { items: Item[]; fmt: (n: number) => string } = $props();

	const max = $derived(Math.max(1, ...items.map((i) => i.value)));
</script>

<div class="bars">
	{#each items as it (it.label)}
		<div class="row">
			<span class="label" title={it.label}>{it.label}</span>
			<div class="track">
				<div
					class="fill"
					style="width: {(it.value / max) * 100}%; background: {it.color}"
				></div>
			</div>
			<span class="val">{fmt(it.value)}</span>
		</div>
	{:else}
		<p class="empty">No data.</p>
	{/each}
</div>

<style>
	.bars {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}
	.row {
		display: grid;
		grid-template-columns: 7.5rem 1fr auto;
		align-items: center;
		gap: 0.6rem;
	}
	.label {
		font-size: 0.8rem;
		color: var(--text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.track {
		height: 0.6rem;
		background: var(--track);
		border-radius: 999px;
		overflow: hidden;
	}
	.fill {
		height: 100%;
		border-radius: 999px;
		transition: width 0.4s ease;
		min-width: 2px;
	}
	.val {
		font-size: 0.8rem;
		font-variant-numeric: tabular-nums;
		color: var(--text);
		white-space: nowrap;
	}
	.empty {
		color: var(--text-muted);
		font-size: 0.85rem;
		margin: 0;
	}
</style>
