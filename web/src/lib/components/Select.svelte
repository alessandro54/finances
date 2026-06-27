<script lang="ts">
	import { catColor, catDisplay, OTHERS } from '$lib/category';

	let {
		value,
		options,
		onChange
	}: { value: string; options: string[]; onChange: (v: string) => void } = $props();

	let open = $state(false);
	let root: HTMLDivElement;

	// '' is the Others bucket; render it as the first choice.
	const choices = $derived(['', ...options]);

	function pick(v: string) {
		open = false;
		if (v !== value) onChange(v);
	}

	function onWindowClick(e: MouseEvent) {
		if (open && root && !root.contains(e.target as Node)) open = false;
	}
</script>

<svelte:window onclick={onWindowClick} onkeydown={(e) => e.key === 'Escape' && (open = false)} />

<div class="select" bind:this={root}>
	<button type="button" class="trigger" aria-haspopup="listbox" aria-expanded={open} onclick={() => (open = !open)}>
		<span class="dot" style="background: {catColor(value)}"></span>
		<span class="cur">{value ? catDisplay(value) : OTHERS}</span>
		<svg class="chev" class:up={open} viewBox="0 0 12 12" width="11" height="11" aria-hidden="true">
			<path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	</button>

	{#if open}
		<ul class="menu" role="listbox">
			{#each choices as c (c)}
				<li>
					<button
						type="button"
						class="opt"
						class:sel={c === value}
						role="option"
						aria-selected={c === value}
						onclick={() => pick(c)}
					>
						<span class="dot" style="background: {catColor(c)}"></span>
						<span>{c ? catDisplay(c) : OTHERS}</span>
						{#if c === value}
							<svg class="check" viewBox="0 0 12 12" width="11" height="11" aria-hidden="true">
								<path d="M2.5 6.5l2.5 2.5 4.5-5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
						{/if}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.select {
		position: relative;
		display: inline-block;
	}
	.trigger {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 150px;
		padding: 0.35rem 0.55rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--surface);
		color: var(--text);
		font: inherit;
		cursor: pointer;
		transition: border-color 0.15s, background 0.15s;
	}
	.trigger:hover {
		border-color: var(--accent);
	}
	.cur {
		flex: 1;
		text-align: left;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.chev {
		color: var(--text-muted);
		transition: transform 0.15s;
	}
	.chev.up {
		transform: rotate(180deg);
	}
	.dot {
		width: 9px;
		height: 9px;
		border-radius: 999px;
		flex: none;
	}
	.menu {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		right: 0;
		z-index: 20;
		margin: 0;
		padding: 0.25rem;
		list-style: none;
		max-height: 240px;
		overflow-y: auto;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 10px;
		box-shadow: var(--shadow);
	}
	.opt {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.4rem 0.5rem;
		border: none;
		border-radius: 7px;
		background: transparent;
		color: var(--text);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}
	.opt:hover {
		background: var(--track);
	}
	.opt.sel {
		color: var(--accent);
		font-weight: 600;
	}
	.check {
		margin-left: auto;
		color: var(--accent);
	}
</style>
