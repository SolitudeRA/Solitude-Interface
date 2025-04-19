import { env } from '@api/config/env';
import type { AxiosInstance } from 'axios';

export function adaptURLToResourceWorkers(origin: URL): URL {
    const adaptedUrl = new URL(origin.toString());
    adaptedUrl.hostname = env.workers.resource.url;
    return adaptedUrl;
}

export function adaptClientToZeroTrust(request: AxiosInstance): AxiosInstance {
    request.interceptors.request.use((config) => {
        // 设置Cloudflare Access认证头
        config.headers = config.headers || {};
        config.headers['CF-Access-Client-Id'] = env.ghost.accessId;
        config.headers['CF-Access-Client-Secret'] = env.ghost.accessSecret;

        return config;
    });

    return request;
}
