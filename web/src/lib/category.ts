// Client-safe helpers (no server-only imports — usable in .svelte components).

export const OTHERS = 'Others';

/** Display label for a possibly-null/blank category. */
export function catLabel(c: string | null | undefined): string {
	return c && c.trim() ? c : OTHERS;
}
