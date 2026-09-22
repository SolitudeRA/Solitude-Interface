// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadPostArchiveData } from './postArchiveDataClient';

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('post archive data client', () => {
    it('deduplicates preload and visible requests for the same static JSON URL', async () => {
        const payload = {
            version: 1 as const,
            posts: [],
            facets: { categories: [], types: [] },
            seriesMetadata: {},
        };
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue(payload),
        });
        vi.stubGlobal('fetch', fetchMock);

        const first = loadPostArchiveData('/zh/post-archive.test.json');
        const second = loadPostArchiveData('/zh/post-archive.test.json');

        await expect(first).resolves.toEqual(payload);
        await expect(second).resolves.toEqual(payload);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('drops a failed request so the visible retry can fetch again', async () => {
        const payload = {
            version: 1 as const,
            posts: [],
            facets: { categories: [], types: [] },
            seriesMetadata: {},
        };
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce({ ok: false, status: 503 })
            .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue(payload) });
        vi.stubGlobal('fetch', fetchMock);

        await expect(loadPostArchiveData('/zh/post-archive.retry.json')).rejects.toThrow('503');
        await expect(loadPostArchiveData('/zh/post-archive.retry.json')).resolves.toEqual(payload);
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });
});
