<script lang="ts">
	import { fly } from 'svelte/transition';
	import { catColor, catDisplay, isOthers, OTHERS } from '$lib/category';

	let {
		value,
		options,
		onChange
	}: { value: string; options: string[]; onChange: (v: string) => void } = $props();

	let open = $state(false);
	let root: HTMLDivElement;

	// '' is the single "Others" choice; drop any 'other'/'others' option that would duplicate it.
	const choices = $derived(['', ...options.filter((o) => !isOthers(o))]);

	function pick(v: string) {
		open = false;
		// Always fire — re-selecting the current category is a valid "confirm".
		onChange(v);
	}

	function onWindowClick(e: MouseEvent) {
		if (open && root && !root.contains(e.target as Node)) open = false;
	}
</script>

<svelte:window onclick={onWindowClick} onkeydown={(e) => e.key === 'Escape' && (open = false)} />

<div class="relative inline-block" bind:this={root}>
	<button
		type="button"
		aria-haspopup="listbox"
		aria-expanded={open}
		onclick={() => (open = !open)}
		class="inline-flex min-w-[150px] cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-2 py-1.5 text-text transition-colors hover:border-accent"
	>
		<span class="h-[9px] w-[9px] shrink-0 rounded-full" style="background: {catColor(value)}"></span>
		<span class="flex-1 truncate text-left">{value ? catDisplay(value) : OTHERS}</span>
		<svg
			class="text-muted transition-transform {open ? 'rotate-180' : ''}"
			viewBox="0 0 12 12"
			width="11"
			height="11"
			aria-hidden="true"
		>
			<path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	</button>

	{#if open}
		<ul
			role="listbox"
			transition:fly={{ y: -6, duration: 130 }}
			class="absolute left-0 right-0 top-[calc(100%+4px)] z-20 m-0 max-h-60 list-none overflow-y-auto rounded-[10px] border border-border bg-surface p-1 shadow-[var(--shadow)]"
		>
			{#each choices as c (c)}
				<li>
					<button
						type="button"
						role="option"
						aria-selected={c === value}
						onclick={() => pick(c)}
						class="flex w-full cursor-pointer items-center gap-2 rounded-[7px] px-2 py-1.5 text-left hover:bg-track {c ===
						value
							? 'font-semibold text-accent'
							: 'text-text'}"
					>
						<span class="h-[9px] w-[9px] shrink-0 rounded-full" style="background: {catColor(c)}"></span>
						<span>{c ? catDisplay(c) : OTHERS}</span>
						{#if c === value}
							<svg class="ml-auto text-accent" viewBox="0 0 12 12" width="11" height="11" aria-hidden="true">
								<path d="M2.5 6.5l2.5 2.5 4.5-5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
						{/if}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
