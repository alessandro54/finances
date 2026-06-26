import { env } from '$env/dynamic/private';

/** Server-side fetch to finances-api. The API token never reaches the browser. */
export async function api<T = unknown>(path: string, init?: RequestInit): Promise<T> {
	const base = env.API_BASE ?? 'http://localhost:8080';
	const r = await fetch(`${base}${path}`, {
		...init,
		headers: {
			'content-type': 'application/json',
			...init?.headers,
			Authorization: `Bearer ${env.API_TOKEN}`
		}
	});
	if (!r.ok) {
		const body = await r.text().catch(() => '');
		throw new Error(`api ${init?.method ?? 'GET'} ${path}: ${r.status} ${body}`);
	}
	return r.json() as Promise<T>;
}
