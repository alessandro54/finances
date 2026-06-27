<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fade, scale } from 'svelte/transition';

	let {
		open = $bindable(false),
		title = '',
		children
	}: { open?: boolean; title?: string; children?: Snippet } = $props();

	function close() {
		open = false;
	}
</script>

<svelte:window onkeydown={(e) => open && e.key === 'Escape' && close()} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 px-4 pb-8 pt-16 backdrop-blur-[2px]"
		onclick={close}
		role="presentation"
		transition:fade={{ duration: 150 }}
	>
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div
			class="panel w-full max-w-[620px] shadow-[0_12px_48px_rgba(0,0,0,0.25)]"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			transition:scale={{ start: 0.96, duration: 160 }}
		>
			<header class="flex items-center justify-between border-b border-border px-5 py-4">
				<h2 class="m-0 text-[1.05rem] tracking-tight">{title}</h2>
				<button
					class="cursor-pointer rounded-[7px] border-none bg-transparent px-1.5 py-1 text-base text-muted hover:bg-track hover:text-text"
					onclick={close}
					aria-label="Close">✕</button
				>
			</header>
			<div class="px-5 pb-5 pt-4">
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}
