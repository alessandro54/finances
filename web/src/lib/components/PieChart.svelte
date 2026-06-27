<script lang="ts">
	import { Chart, Svg, Group, Pie, Arc } from 'layerchart';

	type Item = { label: string; value: number; color: string };
	let { items, fmt }: { items: Item[]; fmt: (n: number) => string } = $props();

	const total = $derived(items.reduce((s, i) => s + i.value, 0));
	let hovered = $state<number | null>(null);
	const active = $derived(hovered !== null ? items[hovered] : null);
</script>

{#if total > 0}
	<div class="flex flex-wrap items-center gap-5">
		<div class="relative h-[156px] w-[156px] shrink-0">
			<Chart data={items} x="value">
				<Svg center>
					<Group>
						<Pie padAngle={0.02}>
							{#snippet children({ arcs })}
								{#each arcs as arc, i (items[i].label)}
									<Arc
										startAngle={arc.startAngle}
										endAngle={arc.endAngle}
										innerRadius={48}
										outerRadius={72}
										cornerRadius={3}
										fill={items[i].color}
										fill-opacity={hovered === null || hovered === i ? 1 : 0.35}
										onpointerenter={() => (hovered = i)}
										onpointerleave={() => (hovered = null)}
										class="cursor-pointer transition-[fill-opacity] duration-150"
									/>
								{/each}
							{/snippet}
						</Pie>
					</Group>
				</Svg>
			</Chart>

			<!-- center: active slice on hover, else total -->
			<div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
				<span class="text-[0.6rem] uppercase tracking-wider text-muted">{active ? active.label : 'Total'}</span>
				<span class="text-sm font-bold tabular-nums">{fmt(active ? active.value : total)}</span>
			</div>
		</div>

		<ul class="m-0 flex min-w-[160px] flex-1 list-none flex-col gap-1.5 p-0">
			{#each items as it, i (it.label)}
				<li
					class="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 rounded px-1 py-0.5 text-sm transition-colors {hovered ===
					i
						? 'bg-track'
						: ''}"
					onpointerenter={() => (hovered = i)}
					onpointerleave={() => (hovered = null)}
				>
					<span class="h-[9px] w-[9px] rounded-full" style="background: {it.color}"></span>
					<span class="truncate text-text" title={it.label}>{it.label}</span>
					<span class="tabular-nums text-muted">{total > 0 ? Math.round((it.value / total) * 100) : 0}%</span>
					<span class="font-medium tabular-nums text-text">{fmt(it.value)}</span>
				</li>
			{/each}
		</ul>
	</div>
{:else}
	<p class="m-0 text-sm text-muted">No data.</p>
{/if}
