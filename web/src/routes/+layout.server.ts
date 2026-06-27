import type { LayoutServerLoad } from './$types';

// `owner` is read by the layout (login/logout UI + demo banner) and by every
// page (to gate edit controls). It rides in layout data so it's on page.data everywhere.
export const load: LayoutServerLoad = async ({ locals }) => ({ owner: locals.owner });
