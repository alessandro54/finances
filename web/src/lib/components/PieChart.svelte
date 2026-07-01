<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, Svg, Group, Pie, Arc } from 'layerchart';

	type Item = { label: string; value: number; color: string };
	let { items, fmt }: { items: Item[]; fmt: (n: number) => string } = $props();

	const total = $derived(items.reduce((s, i) => s + i.value, 0));
	let hovered = $state<number | null>(null);
	const active = $derived(hovered !== null ? items[hovered] : null);

	// Render layerchart only on the client: it measures the DOM, so SSR output
	// never matches the hydrated tree and the mismatch can blank the page.
	let mounted = $state(false);
	onMount(() => (mounted = true));

	// Legend shows the top 3 by default; the rest collapse into one compact row.
	let expanded = $state(false);
	const rest = $derived(items.slice(3));
	const restSum = $derived(rest.reduce((s, i) => s + i.value, 0));
	const shown = $derived(expanded ? items : items.slice(0, 3));
</script>

{#if total > 0}
	<div class="flex flex-wrap items-center gap-5">
		<div class="relative h-[156px] w-[156px] shrink-0">
			{#if mounted}
				<Chart data={items} x="value">
					<Svg center>
						<Group>
							<Pie padAngle={0.02}>
								{#snippet children({ arcs })}
									{#each arcs as arc, i (items[i].label)}
										<Arc
											startAngle={arc.startAngle}
											endAngle={arc.endAngle}
											innerRadius={50}
											outerRadius={72}
											cornerRadius={2}
											fill="transparent"
											stroke={items[i].color}
											stroke-width={hovered === i ? 3.5 : 2}
											stroke-opacity={hovered === null || hovered === i ? 1 : 0.3}
											pointer-events="all"
											onpointerenter={() => (hovered = i)}
											onpointerleave={() => (hovered = null)}
											class="cursor-pointer transition-[stroke-width,stroke-opacity] duration-150"
										/>
									{/each}
								{/snippet}
							</Pie>
						</Group>
					</Svg>
				</Chart>
			{/if}

			<!-- center: active slice on hover, else total -->
			<div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
				<span class="text-[0.6rem] uppercase tracking-wider text-muted">{active ? active.label : 'Total'}</span>
				<span class="text-sm font-bold tabular-nums">{fmt(active ? active.value : total)}</span>
			</div>
		</div>

		<ul class="m-0 flex min-w-[160px] flex-1 list-none flex-col gap-1.5 p-0">
			{#each shown as it, i (it.label)}
				<li
					class="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 rounded px-1 py-0.5 text-sm transition-colors {hovered ===
					i
						? 'bg-track'
						: ''}"
					onpointerenter={() => (hovered = i)}
					onpointerleave={() => (hovered = null)}
				>
					<span class="h-2.5 w-2.5 rounded-full" style="border: 1.5px solid {it.color}"></span>
					<span class="truncate text-text" title={it.label}>{it.label}</span>
					<span class="tabular-nums text-muted">{total > 0 ? Math.round((it.value / total) * 100) : 0}%</span>
					<span class="font-medium tabular-nums text-text">{fmt(it.value)}</span>
				</li>
			{/each}
			{#if rest.length}
				<li>
					<button
						onclick={() => (expanded = !expanded)}
						class="grid w-full grid-cols-[auto_1fr_auto_auto] items-center gap-2 rounded px-1 py-0.5 text-left text-sm text-muted transition-colors hover:bg-track"
					>
						<span class="text-[0.7rem] leading-none">{expanded ? '▴' : '▾'}</span>
						<span>{expanded ? 'show less' : `+${rest.length} more`}</span>
						<span class="tabular-nums">{total > 0 ? Math.round((restSum / total) * 100) : 0}%</span>
						<span class="font-medium tabular-nums">{fmt(restSum)}</span>
					</button>
				</li>
			{/if}
		</ul>
	</div>
{:else}
	<p class="m-0 text-sm text-muted">No data.</p>
{/if}
