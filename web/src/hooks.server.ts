import type { Handle } from '@sveltejs/kit';
import { SESSION_COOKIE, isValidSession } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.owner = isValidSession(event.cookies.get(SESSION_COOKIE));
	return resolve(event);
};
