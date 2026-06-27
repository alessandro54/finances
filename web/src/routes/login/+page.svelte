<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	let { form }: PageProps = $props();
</script>

<div class="mx-auto mt-20 max-w-sm">
	<div class="panel p-6">
		<h1 class="m-0 text-lg font-semibold tracking-tight">Log in</h1>
		<p class="mb-4 mt-1 text-sm text-muted">Owner access — unlocks your real data and editing.</p>
		<form method="POST" use:enhance class="flex flex-col gap-3">
			<!-- svelte-ignore a11y_autofocus -->
			<input
				name="password"
				type="password"
				placeholder="Password"
				required
				autofocus
				class="rounded-[9px] border border-border bg-surface px-3 py-2 text-text"
			/>
			{#if form?.error}
				<p class="m-0 text-sm text-[#dc2626]">{form.error}</p>
			{/if}
			<button
				type="submit"
				class="cursor-pointer rounded-[9px] bg-accent px-3.5 py-2 font-semibold text-white hover:brightness-105"
				>Unlock</button
			>
		</form>
	</div>
	<p class="mt-4 text-center text-xs text-muted">
		Not the owner? <a href="/" class="text-accent">Browse the demo →</a>
	</p>
</div>
