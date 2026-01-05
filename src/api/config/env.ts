import {
    GHOST_URL,
    GHOST_CONTENT_KEY,
    GHOST_VERSION,
    GHOST_TIMEOUT,
    SITE_URL,
    IMAGE_HOST_URL,
    CF_ACCESS_CLIENT_ID,
    CF_ACCESS_CLIENT_SECRET,
} from 'astro:env/server';

interface SiteEnvVars {
    url: string;
}

interface ImageEnvVars {
    imageHostUrl: string;
}

interface GhostEnvVars {
    url: string;
    key: string;
    version: string;
    timeout: number;
}

interface CloudflareEnvVars {
    accessClientId: string;
    accessClientSecret: string;
}

export const env = Object.freeze({
    site: {
        url: SITE_URL,
    } as SiteEnvVars,
    image: {
        imageHostUrl: IMAGE_HOST_URL,
    } as ImageEnvVars,
    ghost: {
        url: GHOST_URL,
        key: GHOST_CONTENT_KEY,
        version: GHOST_VERSION,
        timeout: GHOST_TIMEOUT,
    } as GhostEnvVars,
    cloudflare: {
        accessClientId: CF_ACCESS_CLIENT_ID,
        accessClientSecret: CF_ACCESS_CLIENT_SECRET,
    } as CloudflareEnvVars,
});
