import dotenv from 'dotenv';

dotenv.config();

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

export const env = Object.freeze({
    site: {
        url: getEnv('SITE_URL'),
    } as SiteEnvVars,
    image: {
        imageHostUrl: getEnv('IMAGE_HOST_URL', ''),
    } as ImageEnvVars,
    ghost: {
        url: getEnv('GHOST_URL'),
        key: getEnv('GHOST_CONTENT_KEY'),
        version: getEnv('GHOST_VERSION', 'v5.0'),
        timeout: getEnvAsNumber('GHOST_TIMEOUT', 5000),
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

function getEnvAsNumber(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (!value) {
        return defaultValue;
    }
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
        console.warn(`Environment variable ${key} is not a valid number, using default: ${defaultValue}`);
        return defaultValue;
    }
    return parsed;
}
