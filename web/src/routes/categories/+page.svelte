<script lang="ts">
	import { enhance } from '$app/forms';
	import { catColor, catDisplay } from '$lib/category';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<div class="bar">
	<div>
		<h1>Categories</h1>
		<p class="sub">{data.categories.length} categories</p>
	</div>
	<form method="POST" action="?/add" use:enhance class="add">
		<input name="name" placeholder="New category" required />
		<button type="submit">Add</button>
	</form>
</div>

<section class="card list-card">
	<table>
		<thead>
			<tr><th>Category</th><th class="num">Transactions</th><th></th></tr>
		</thead>
		<tbody>
			{#each data.categories as c (c)}
				<tr>
					<td class="name">
						<span class="dot" style="background: {catColor(c)}"></span>{catDisplay(c)}
					</td>
					<td class="num muted">{data.counts[c] ?? 0}</td>
					<td class="num">
						<form
							method="POST"
							action="?/remove"
							use:enhance
							onsubmit={(e) => {
								if (!confirm(`Delete "${c}"? Its transactions move to Others.`)) e.preventDefault();
							}}
						>
							<input type="hidden" name="name" value={c} />
							<button class="del" type="submit">Delete</button>
						</form>
					</td>
				</tr>
			{:else}
				<tr><td colspan="3" class="muted center">No categories yet.</td></tr>
			{/each}
		</tbody>
	</table>
</section>

<p class="note">
	<span class="dot" style="background: {catColor(null)}"></span>
	Transactions with no category are grouped as <strong>Others</strong>.
</p>

<style>
	.bar {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.25rem;
		flex-wrap: wrap;
	}
	h1 {
		font-size: 1.4rem;
		margin: 0;
		letter-spacing: -0.02em;
	}
	.sub {
		margin: 0.1rem 0 0;
		color: var(--text-muted);
		font-size: 0.85rem;
	}
	.add {
		display: flex;
		gap: 0.5rem;
	}
	.add input {
		padding: 0.45rem 0.7rem;
		border: 1px solid var(--border);
		border-radius: 9px;
		background: var(--surface);
		color: var(--text);
		font: inherit;
	}
	button {
		padding: 0.45rem 0.9rem;
		border: 1px solid transparent;
		border-radius: 9px;
		background: var(--accent);
		color: #fff;
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}
	button:hover {
		filter: brightness(1.05);
	}

	.card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
	}
	.list-card {
		overflow: hidden;
		max-width: 540px;
	}
	table {
		width: 100%;
		border-collapse: collapse;
	}
	th,
	td {
		text-align: left;
		padding: 0.7rem 1rem;
		border-bottom: 1px solid var(--border);
	}
	tbody tr:last-child td {
		border-bottom: none;
	}
	tbody tr:hover {
		background: var(--bg);
	}
	th {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-muted);
		font-weight: 600;
	}
	.name {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		font-weight: 500;
	}
	.dot {
		width: 9px;
		height: 9px;
		border-radius: 999px;
		flex: none;
		display: inline-block;
	}
	.num {
		text-align: right;
	}
	.muted {
		color: var(--text-muted);
	}
	.center {
		text-align: center;
	}
	.del {
		background: transparent;
		color: #dc2626;
		border-color: #f0c4c4;
		padding: 0.3rem 0.7rem;
		font-weight: 500;
	}
	.del:hover {
		background: #fef2f2;
		filter: none;
	}
	.note {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--text-muted);
		font-size: 0.85rem;
		margin-top: 1rem;
	}
</style>
