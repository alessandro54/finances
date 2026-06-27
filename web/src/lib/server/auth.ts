import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';

// Single-owner gate. Logged in (cookie present + valid) = real data + edit.
// Everyone else = synthetic demo, reads only. Cookie holds an HMAC of a fixed
// marker keyed by SESSION_SECRET — unforgeable without the secret, and rotating
// the secret invalidates all sessions.

export const SESSION_COOKIE = 'fin_owner';

function expected(): string {
	return createHmac('sha256', env.SESSION_SECRET ?? '').update('owner-v1').digest('hex');
}

function constEq(a: string, b: string): boolean {
	const ba = Buffer.from(a);
	const bb = Buffer.from(b);
	return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** The value to store in the session cookie on successful login. */
export function sessionValue(): string {
	return expected();
}

/** True if the cookie value is a valid owner session. */
export function isValidSession(v: string | undefined): boolean {
	return !!v && constEq(v, expected());
}

/** Constant-time check of a submitted password against OWNER_PASSWORD. */
export function checkPassword(pw: string): boolean {
	const want = env.OWNER_PASSWORD ?? '';
	return want !== '' && constEq(pw, want);
}
