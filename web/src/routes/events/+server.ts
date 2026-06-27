import { env } from '$env/dynamic/private';

// Proxies the API's SSE stream to the browser so the bearer token stays server-side.
export async function GET({ fetch }) {
	const base = env.API_BASE ?? 'http://localhost:8080';
	const upstream = await fetch(`${base}/api/events`, {
		headers: { Authorization: `Bearer ${env.API_TOKEN}` }
	});
	return new Response(upstream.body, {
		headers: {
			'content-type': 'text/event-stream',
			'cache-control': 'no-cache',
			connection: 'keep-alive'
		}
	});
}
