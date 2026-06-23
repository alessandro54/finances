# finances-web

Minimal SvelteKit dashboard → Vercel. Talks to `finances-api` **server-side** (the API token
never reaches the browser). Converts PEN/USD client-side.

## Init (once)
```bash
cd web
npm create svelte@latest .   # Skeleton project, TypeScript, no extras
npm install
npm i -D @sveltejs/adapter-vercel
```
Set the Vercel adapter in `svelte.config.js` (`import adapter from '@sveltejs/adapter-vercel'`).

## Env (Vercel project settings → Environment Variables; local: `web/.env`)
```
API_BASE=https://finances-api.<your-domain>
API_TOKEN=<same API_TOKEN as the Rust API>
DASH_PASSWORD=<your dash password>
```
These are **server-only** (no `PUBLIC_` prefix) → never shipped to the browser.

## Wire it (3 files)

`src/lib/api.ts` — server-side fetch helper:
```ts
import { env } from '$env/dynamic/private';
export async function api(path: string, init?: RequestInit) {
  const r = await fetch(`${env.API_BASE}${path}`, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${env.API_TOKEN}` },
  });
  if (!r.ok) throw new Error(`api ${path}: ${r.status}`);
  return r.json();
}
```

`src/hooks.server.ts` — single-password gate via cookie:
```ts
import { env } from '$env/dynamic/private';
import { redirect, type Handle } from '@sveltejs/kit';
export const handle: Handle = async ({ event, resolve }) => {
  const authed = event.cookies.get('dash') === env.DASH_PASSWORD;
  if (!authed && event.url.pathname !== '/login') throw redirect(303, '/login');
  return resolve(event);
};
```
(`/login` = a tiny form that sets the `dash` cookie when the password matches. ~15 lines.)

`src/routes/+page.server.ts` — load + recategorize action:
```ts
import { api } from '$lib/api';
export const load = async ({ url }) => {
  const month = url.searchParams.get('month') ?? '';
  const [stats, transactions, categories] = await Promise.all([
    api(`/api/stats?month=${month}`),
    api(`/api/transactions?month=${month}&limit=200`),
    api('/api/categories'),
  ]);
  return { month, stats, transactions, categories };
};
export const actions = {
  recategorize: async ({ request }) => {
    const f = await request.formData();
    await api(`/api/transactions/${f.get('id')}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ category: f.get('category') }),
    });
    return { ok: true };
  },
};
```

`+page.svelte`: render `data.stats.by_currency` (month totals), `by_category` (bars), and a
`data.transactions` table with a `<select>` of `data.categories` that POSTs the `recategorize`
action. Convert USD→PEN in the client with a rate constant or a small FX fetch.

## Deploy
Push to GitHub → import `web/` as a Vercel project (root = `web`). Set the 3 env vars. Done.
