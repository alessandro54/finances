<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	let { children } = $props();
	const nav = [
		{ href: '/', label: 'Transactions' },
		{ href: '/categories', label: 'Categories' }
	];

	let theme = $state<'light' | 'dark'>('light');
	onMount(() => {
		theme = (document.documentElement.dataset.theme as 'light' | 'dark') || 'light';
	});
	function toggleTheme() {
		theme = theme === 'dark' ? 'light' : 'dark';
		document.documentElement.dataset.theme = theme;
		try {
			localStorage.setItem('theme', theme);
		} catch (e) {}
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header>
	<a class="brand" href="/">
		<span class="logo" aria-hidden="true">
			<svg viewBox="0 0 24 24" width="20" height="20" fill="none">
				<rect x="3" y="13" width="4" height="8" rx="1.2" fill="currentColor" opacity="0.55" />
				<rect x="10" y="8" width="4" height="13" rx="1.2" fill="currentColor" opacity="0.8" />
				<rect x="17" y="3" width="4" height="18" rx="1.2" fill="currentColor" />
			</svg>
		</span>
		<span class="name">finances</span>
	</a>
	<nav>
		{#each nav as n}
			<a href={n.href} class:active={page.url.pathname === n.href}>{n.label}</a>
		{/each}
	</nav>
	<button class="theme" type="button" onclick={toggleTheme} aria-label="Toggle theme" title="Toggle theme">
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

<main>
	{@render children()}
</main>

<style>
	:global(:root) {
		--bg: #f7f8fa;
		--surface: #ffffff;
		--border: #e8eaef;
		--text: #1a1d24;
		--text-muted: #7c828e;
		--track: #eef0f4;
		--accent: #6366f1;
		--accent-2: #8b5cf6;
		--shadow: 0 1px 2px rgba(16, 18, 27, 0.04), 0 4px 16px rgba(16, 18, 27, 0.04);
		--radius: 12px;
		--header-bg: rgba(255, 255, 255, 0.85);
		--warn-bg: #fffbeb;
		--warn-border: #f6c453;
		--warn-text: #92580e;
	}
	:global(:root[data-theme='dark']) {
		--bg: #0e1014;
		--surface: #171a21;
		--border: #262a33;
		--text: #e8eaf0;
		--text-muted: #8b919e;
		--track: #232733;
		--accent: #818cf8;
		--accent-2: #a78bfa;
		--shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 6px 20px rgba(0, 0, 0, 0.35);
		--header-bg: rgba(23, 26, 33, 0.8);
		--warn-bg: rgba(245, 158, 11, 0.1);
		--warn-border: #8a6d3b;
		--warn-text: #fbbf24;
	}
	:global(body) {
		margin: 0;
		font: 14px/1.5 ui-sans-serif, system-ui, -apple-system, sans-serif;
		color: var(--text);
		background: var(--bg);
		-webkit-font-smoothing: antialiased;
	}
	:global(*) {
		box-sizing: border-box;
	}

	header {
		display: flex;
		align-items: center;
		gap: 2rem;
		padding: 0 1.5rem;
		height: 56px;
		background: var(--header-bg);
		backdrop-filter: saturate(180%) blur(8px);
		border-bottom: 1px solid var(--border);
		position: sticky;
		top: 0;
		z-index: 10;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		text-decoration: none;
		color: var(--text);
	}
	.logo {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border-radius: 9px;
		color: #fff;
		background: linear-gradient(135deg, var(--accent), var(--accent-2));
		box-shadow: 0 2px 8px rgba(99, 102, 241, 0.35);
	}
	.name {
		font-weight: 700;
		font-size: 1rem;
		letter-spacing: -0.01em;
	}
	nav {
		display: flex;
		gap: 0.25rem;
	}
	.theme {
		margin-left: auto;
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		border: 1px solid var(--border);
		border-radius: 9px;
		background: var(--surface);
		color: var(--text-muted);
		cursor: pointer;
		transition: color 0.15s, border-color 0.15s;
	}
	.theme:hover {
		color: var(--text);
		border-color: var(--accent);
	}
	nav a {
		padding: 0.35rem 0.75rem;
		border-radius: 8px;
		color: var(--text-muted);
		text-decoration: none;
		font-weight: 500;
		transition: background 0.15s, color 0.15s;
	}
	nav a:hover {
		background: var(--track);
		color: var(--text);
	}
	nav a.active {
		background: var(--accent);
		color: #fff;
	}
	main {
		max-width: 1000px;
		margin: 0 auto;
		padding: 1.75rem 1.5rem 3rem;
	}
</style>
