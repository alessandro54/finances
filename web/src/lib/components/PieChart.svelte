<script lang="ts">
	import { Chart, Svg, Group, Pie, Arc } from 'layerchart';

	type Item = { label: string; value: number; color: string };
	let { items, fmt }: { items: Item[]; fmt: (n: number) => string } = $props();

	const total = $derived(items.reduce((s, i) => s + i.value, 0));

	let hovered = $state<number | null>(null);
	let mx = $state(0);
	let my = $state(0);
	let box = $state<HTMLDivElement>();

	function track(e: PointerEvent) {
		const r = box?.getBoundingClientRect();
		if (!r) return;
		mx = e.clientX - r.left;
		my = e.clientY - r.top;
	}

	const active = $derived(hovered !== null ? items[hovered] : null);
	const pct = $derived(active && total > 0 ? Math.round((active.value / total) * 100) : 0);
</script>

{#if total > 0}
	<div class="flex flex-wrap items-center gap-5">
		<div bind:this={box} class="relative h-[156px] w-[156px] shrink-0">
			<Chart data={items} x="value">
				<Svg center>
					<Group center>
						<Pie padAngle={0.02} let:arcs>
							{#each arcs as arc, i (items[i].label)}
								<Arc
									startAngle={arc.startAngle}
									endAngle={arc.endAngle}
									innerRadius={48}
									outerRadius={72}
									cornerRadius={3}
									fill={items[i].color}
									fillOpacity={hovered === null || hovered === i ? 1 : 0.35}
									data={items[i]}
									onpointerenter={() => (hovered = i)}
									onpointermove={track}
									onpointerleave={() => (hovered = null)}
									tweened
									class="cursor-pointer transition-[fill-opacity] duration-150"
								/>
							{/each}
						</Pie>
					</Group>
				</Svg>
			</Chart>

			<!-- center label: active slice when hovering, else total -->
			<div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
				<span class="text-[0.6rem] uppercase tracking-wider text-muted">{active ? active.label : 'Total'}</span>
				<span class="text-sm font-bold tabular-nums">{fmt(active ? active.value : total)}</span>
			</div>

			{#if active}
				<div
					class="pointer-events-none absolute z-50 whitespace-nowrap rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs shadow-[0_8px_30px_rgba(0,0,0,0.18)]"
					style="left: {Math.min(mx + 12, 156 - 8)}px; top: {my + 12}px"
				>
					<div class="flex items-center gap-1.5 font-semibold">
						<span class="h-[9px] w-[9px] rounded-full" style="background: {active.color}"></span>
						{active.label}
					</div>
					<div class="mt-0.5 tabular-nums text-muted">{fmt(active.value)} · {pct}%</div>
				</div>
			{/if}
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
