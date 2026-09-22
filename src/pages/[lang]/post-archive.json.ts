import type { APIRoute } from 'astro';
import { buildPostArchivePayload } from '@api/ghost/postArchivePayload';
import { isLocale, LOCALES } from '@lib/i18n';

export const prerender = true;

export function getStaticPaths() {
    return LOCALES.map((lang) => ({ params: { lang } }));
}

export const GET: APIRoute = async ({ params }) => {
    const { lang } = params;
    if (!isLocale(lang)) {
        return new Response(JSON.stringify({ error: 'Unsupported locale' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
        });
    }

    const payload = await buildPostArchivePayload(lang);
    return new Response(JSON.stringify(payload), {
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, max-age=0, must-revalidate',
            'X-Content-Type-Options': 'nosniff',
        },
    });
};
