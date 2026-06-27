import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { SESSION_COOKIE, sessionValue, checkPassword } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.owner) redirect(303, '/');
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const f = await request.formData();
		const pw = String(f.get('password') ?? '');
		if (!checkPassword(pw)) return fail(401, { error: 'Wrong password.' });
		cookies.set(SESSION_COOKIE, sessionValue(), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: !dev,
			maxAge: 60 * 60 * 24 * 30 // 30 days
		});
		redirect(303, '/');
	},

	logout: async ({ cookies }) => {
		cookies.delete(SESSION_COOKIE, { path: '/' });
		redirect(303, '/');
	}
};
