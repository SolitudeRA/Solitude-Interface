import { env } from '@api/config/env';

export function adaptToResourceWorkers(origin: URL): URL {
    const adaptedUrl = new URL(origin.toString());
    adaptedUrl.hostname = env.workers.resource.url;
    return adaptedUrl;
}
