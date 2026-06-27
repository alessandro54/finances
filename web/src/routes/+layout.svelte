<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';

	let { children } = $props();
	const nav = [
		{ href: '/', label: 'Transactions' },
		{ href: '/categories', label: 'Categories' }
	];

	let theme = $state<'light' | 'dark'>('light');
	onMount(() => {
		theme = (document.documentElement.dataset.theme as 'light' | 'dark') || 'light';

		// Live updates: SSE push → debounced refetch (no polling).
		const es = new EventSource('/events');
		let t: ReturnType<typeof setTimeout>;
		es.addEventListener('change', () => {
			clearTimeout(t);
			t = setTimeout(() => invalidateAll(), 250);
		});
		return () => {
			es.close();
			clearTimeout(t);
		};
	});
	function toggleTheme() {
		theme = theme === 'dark' ? 'light' : 'dark';
		document.documentElement.dataset.theme = theme;
		try {
			localStorage.setItem('theme', theme);
		} catch (e) {
			/* ignore */
		}
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header
	class="sticky top-0 z-10 flex h-14 items-center gap-8 border-b border-border bg-[var(--header-bg)] px-6 backdrop-blur-md"
>
	<a class="flex items-center gap-2 text-text no-underline" href="/">
		<span
			class="grid h-8 w-8 place-items-center rounded-[9px] bg-gradient-to-br from-accent to-accent2 text-white shadow-[0_2px_8px_rgba(99,102,241,0.35)]"
			aria-hidden="true"
		>
			<svg viewBox="0 0 24 24" width="20" height="20" fill="none">
				<rect x="3" y="13" width="4" height="8" rx="1.2" fill="currentColor" opacity="0.55" />
				<rect x="10" y="8" width="4" height="13" rx="1.2" fill="currentColor" opacity="0.8" />
				<rect x="17" y="3" width="4" height="18" rx="1.2" fill="currentColor" />
			</svg>
		</span>
		<span class="text-base font-bold tracking-tight">finances</span>
	</a>
	<nav class="flex gap-1">
		{#each nav as n}
			<a
				href={n.href}
				class="rounded-lg px-3 py-1.5 font-medium no-underline transition-colors {page.url
					.pathname === n.href
					? 'bg-accent text-white'
					: 'text-muted hover:bg-track hover:text-text'}"
			>
				{n.label}
			</a>
		{/each}
	</nav>
	<button
		class="ml-auto grid h-[34px] w-[34px] place-items-center rounded-[9px] border border-border bg-surface text-muted transition-colors hover:border-accent hover:text-text"
		type="button"
		onclick={toggleTheme}
		aria-label="Toggle theme"
		title="Toggle theme"
	>
		{#if theme === 'dark'}
			<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
				<circle cx="12" cy="12" r="4" />
				<path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />
			</svg>
		{:else}
			<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
			</svg>
		{/if}
	</button>
</header>

<main class="mx-auto max-w-[1000px] px-6 pb-12 pt-7">
	{@render children()}
</main>
