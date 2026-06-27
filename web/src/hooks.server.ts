import type { Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { SESSION_COOKIE, isValidSession } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	// Local dev is always the owner (real data, no login). Prod requires the session.
	event.locals.owner = dev || isValidSession(event.cookies.get(SESSION_COOKIE));
	return resolve(event);
};
