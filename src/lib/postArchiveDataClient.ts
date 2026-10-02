import type { PostArchivePayload } from './postArchive';

const requests = new Map<string, Promise<PostArchivePayload>>();

function isPostArchivePayload(value: unknown): value is PostArchivePayload {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as Partial<PostArchivePayload>;
    return (
        candidate.version === 1 &&
        Array.isArray(candidate.posts) &&
        Boolean(candidate.facets && typeof candidate.facets === 'object') &&
        Boolean(candidate.seriesMetadata && typeof candidate.seriesMetadata === 'object')
    );
}

export function loadPostArchiveData(url: string): Promise<PostArchivePayload> {
    const absoluteUrl = new URL(url, window.location.href).href;
    const existing = requests.get(absoluteUrl);
    if (existing) return existing;

    const request = fetch(absoluteUrl, {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
    })
        .then(async (response) => {
            if (!response.ok) {
                throw new Error(`Archive data request failed with ${response.status}`);
            }
            const payload: unknown = await response.json();
            if (!isPostArchivePayload(payload)) {
                throw new Error('Archive data response has an invalid shape');
            }
            return payload;
        })
        .catch((error: unknown) => {
            requests.delete(absoluteUrl);
            throw error;
        });

    requests.set(absoluteUrl, request);
    return request;
}

export function preloadPostArchiveData(url: string): void {
    void loadPostArchiveData(url).catch(() => {
        // Preloading is opportunistic. The visible archive owns error reporting and retry UI.
    });
}

export function clearPostArchiveDataRequest(url: string): void {
    requests.delete(new URL(url, window.location.href).href);
}
