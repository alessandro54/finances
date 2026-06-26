<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<h1>Categories</h1>

<form method="POST" action="?/add" use:enhance class="add">
	<input name="name" placeholder="New category" required />
	<button>Add</button>
</form>

<table>
	<thead>
		<tr><th>Name</th><th class="num">Transactions</th><th></th></tr>
	</thead>
	<tbody>
		{#each data.categories as c (c)}
			<tr>
				<td>{c}</td>
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
						<button class="del">Delete</button>
					</form>
				</td>
			</tr>
		{:else}
			<tr><td colspan="3" class="muted">No categories yet.</td></tr>
		{/each}
	</tbody>
</table>

<p class="muted">Transactions with no category are grouped as <strong>Others</strong>.</p>

<style>
	h1 {
		font-size: 1.25rem;
		margin: 0 0 1rem;
	}
	.add {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}
	.add input {
		padding: 0.4rem 0.6rem;
		border: 1px solid #ccc;
		border-radius: 6px;
	}
	button {
		padding: 0.4rem 0.8rem;
		border: 1px solid #ccc;
		border-radius: 6px;
		background: #fff;
		cursor: pointer;
	}
	.del {
		color: #c0392b;
		border-color: #e3b0aa;
	}
	table {
		width: 100%;
		max-width: 480px;
		border-collapse: collapse;
		background: #fff;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		overflow: hidden;
	}
	th,
	td {
		text-align: left;
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid #f0f0f0;
	}
	th {
		background: #f7f7f7;
		font-size: 0.8rem;
		text-transform: uppercase;
		color: #777;
	}
	.num {
		text-align: right;
	}
	.muted {
		color: #888;
	}
</style>
