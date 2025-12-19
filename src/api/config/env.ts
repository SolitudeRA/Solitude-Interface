import dotenv from 'dotenv';

dotenv.config();

interface SiteEnvVars {
    url: string;
}

interface GhostEnvVars {
    url: string;
    key: string;
    version: string;
}

export const env = Object.freeze({
    site: {
        url: getEnv('SITE_URL'),
    } as SiteEnvVars,
    ghost: {
        url: getEnv('GHOST_URL'),
        key: getEnv('GHOST_CONTENT_KEY'),
        version: getEnv('GHOST_VERSION', 'v5.0'),
    } as GhostEnvVars,
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
