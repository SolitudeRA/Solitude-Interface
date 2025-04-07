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

interface ResourceWorkersEnvVars {
    url: string;
    accessClientId: string;
    accessClientSecret: string;
}

export const env = Object.freeze({
    site: {
        url: getEnv('SITE_URL'),
    } as SiteEnvVars,
    ghost: {
        url: getEnv('GHOST_URL'),
        key: getEnv('GHOST_KEY'),
        version: getEnv('GHOST_VERSION', 'v5.0'),
    } as GhostEnvVars,
    workers: {
        resource: {
            url: getEnv('WORKERS_SOURCE_URL'),
            accessClientId: getEnv('WORKERS_SOURCE_ACCESS_ID'),
            accessClientSecret: getEnv('WORKERS_SOURCE_ACCESS_SECRET'),
        } as ResourceWorkersEnvVars,
    },
});

function getEnv(key: string, defaultValue?: string): string {
    const value = process.env[key];
    if (!value) {
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        throw new Error(`环境变量 ${key} 未设置，且没有默认值`);
    }
    return value;
}
