import dotenv from 'dotenv';

dotenv.config();

interface SiteEnvVars {
    url: string;
}

interface GhostEnvVars {
    url: string;
    key: string;
    version: string;
    accessId: string;
    accessSecret: string;
}

interface ResourceWorkersEnvVars {
    url: string;
}

export const env = Object.freeze({
    site: {
        url: getEnv('SITE_URL'),
    } as SiteEnvVars,
    ghost: {
        url: getEnv('GHOST_URL'),
        key: getEnv('GHOST_KEY'),
        version: getEnv('GHOST_VERSION', 'v5.0'),
        accessId: getEnv('CLOUDFLARE_ACCESS_ID'),
        accessSecret: getEnv('CLOUDFLARE_ACCESS_SECRET'),
    } as GhostEnvVars,
    workers: {
        resource: {
            url: getEnv('WORKERS_SOURCE_URL'),
        } as ResourceWorkersEnvVars,
    },
});

function getEnv(key: string, defaultValue?: string): string {
    const value = process.env[key];
    if (!value) {
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        throw new Error(`Environment variable ${key} is not set and no default value is provided.`);
    }
    return value;
}
