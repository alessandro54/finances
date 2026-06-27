<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { catColor, catDisplay, isOthers } from '$lib/category';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const owner = $derived(page.data.owner ?? false); // guests: read-only demo
	// "other"/null is the implicit Others bucket — not a managed category.
	const cats = $derived(data.categories.filter((c) => !isOthers(c)));
</script>

<div class="mb-5 flex flex-wrap items-end justify-between gap-4">
	<div>
		<h1 class="m-0 text-[1.4rem] font-semibold tracking-tight">Categories</h1>
		<p class="mt-0.5 text-sm text-muted">{cats.length} categories</p>
	</div>
	{#if owner}
	<form method="POST" action="?/add" use:enhance class="flex gap-2">
		<input
			name="name"
			placeholder="New category"
			required
			class="rounded-[9px] border border-border bg-surface px-2.5 py-1.5 text-text"
		/>
		<button
			type="submit"
			class="cursor-pointer rounded-[9px] bg-accent px-3.5 py-1.5 font-semibold text-white hover:brightness-105"
			>Add</button
		>
	</form>
	{/if}
</div>

<section class="panel max-w-[540px] overflow-hidden">
	<table class="w-full border-collapse">
		<thead>
			<tr
				class="[&>th]:border-b [&>th]:border-border [&>th]:px-4 [&>th]:py-3 [&>th]:text-left [&>th]:text-xs [&>th]:font-semibold [&>th]:uppercase [&>th]:tracking-wide [&>th]:text-muted"
			>
				<th>Category</th>
				<th class="!text-right">Transactions</th>
				<th></th>
			</tr>
		</thead>
		<tbody class="[&>tr:last-child>td]:border-b-0">
			{#each cats as c (c)}
				<tr class="transition-colors hover:bg-bg [&>td]:border-b [&>td]:border-border [&>td]:px-4 [&>td]:py-3">
					<td class="font-medium">
						<span class="flex items-center gap-2">
							<span class="inline-block h-[9px] w-[9px] shrink-0 rounded-full" style="background: {catColor(c)}"></span>{catDisplay(c)}
						</span>
					</td>
					<td class="text-right text-muted">{data.counts[c] ?? 0}</td>
					<td class="text-right">
						{#if owner}
						<form
							method="POST"
							action="?/remove"
							use:enhance
							onsubmit={(e) => {
								if (!confirm(`Delete "${c}"? Its transactions move to Others.`)) e.preventDefault();
							}}
						>
							<input type="hidden" name="name" value={c} />
							<button
								type="submit"
								class="cursor-pointer rounded-md border border-[#f0c4c4] bg-transparent px-2.5 py-1 font-medium text-[#dc2626] hover:bg-[#fef2f2]"
								>Delete</button
							>
						</form>
						{/if}
					</td>
				</tr>
			{:else}
				<tr><td colspan="3" class="px-4 py-3 text-center text-muted">No categories yet.</td></tr>
			{/each}
		</tbody>
	</table>
</section>

<p class="mt-4 flex items-center gap-2 text-sm text-muted">
	<span class="inline-block h-[9px] w-[9px] shrink-0 rounded-full" style="background: {catColor(null)}"></span>
	Transactions with no category are grouped as <strong>Others</strong>.
</p>
