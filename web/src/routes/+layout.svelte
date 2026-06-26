<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';

	let { children } = $props();
	const nav = [
		{ href: '/', label: 'Transactions' },
		{ href: '/categories', label: 'Categories' }
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header>
	<strong>finances</strong>
	<nav>
		{#each nav as n}
			<a href={n.href} class:active={page.url.pathname === n.href}>{n.label}</a>
		{/each}
	</nav>
</header>

<main>
	{@render children()}
</main>

<style>
	:global(body) {
		margin: 0;
		font: 14px/1.5 ui-sans-serif, system-ui, sans-serif;
		color: #1a1a1a;
		background: #fafafa;
	}
	:global(*) {
		box-sizing: border-box;
	}
	header {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		padding: 0.75rem 1.5rem;
		background: #fff;
		border-bottom: 1px solid #e5e5e5;
	}
	nav {
		display: flex;
		gap: 1rem;
	}
	nav a {
		color: #666;
		text-decoration: none;
	}
	nav a.active {
		color: #1a1a1a;
		font-weight: 600;
	}
	main {
		max-width: 980px;
		margin: 0 auto;
		padding: 1.5rem;
	}
</style>
