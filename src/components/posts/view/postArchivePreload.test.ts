// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { preloadPostArchiveDataMock } = vi.hoisted(() => ({
    preloadPostArchiveDataMock: vi.fn(),
}));

vi.mock('@lib/postArchiveDataClient', () => ({
    preloadPostArchiveData: preloadPostArchiveDataMock,
}));

function renderArchiveShell({
    componentUrl = '/_astro/PostArchiveView.js',
    rendererUrl = '/_astro/client.js',
}: {
    componentUrl?: string;
    rendererUrl?: string;
} = {}): HTMLButtonElement {
    document.body.innerHTML = `
        <button data-view-toggle="list">All posts</button>
        <section data-post-archive-source="/zh/post-archive.json">
            <astro-island
                component-url="${componentUrl}"
                renderer-url="${rendererUrl}"
                client="visible"
            ></astro-island>
        </section>
    `;
    return document.querySelector<HTMLButtonElement>('[data-view-toggle="list"]')!;
}

async function initialize(): Promise<void> {
    const { initPostArchivePreload } = await import('./postArchivePreload');
    initPostArchivePreload();
    document.dispatchEvent(new Event('DOMContentLoaded'));
}

function modulePreloadUrls(): string[] {
    return Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="modulepreload"]')).map(
        (link) => link.href
    );
}

describe('post archive preload', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.useFakeTimers();
        preloadPostArchiveDataMock.mockReset();
        document.head.innerHTML = '';
        document.body.innerHTML = '';
        Reflect.deleteProperty(window, 'requestIdleCallback');
        Reflect.deleteProperty(window, 'cancelIdleCallback');
        window.history.replaceState({}, '', '/zh/post-view');
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('preloads archive data and same-origin island modules on strong intent', async () => {
        const trigger = renderArchiveShell();
        await initialize();

        trigger.dispatchEvent(new Event('pointerenter'));

        expect(preloadPostArchiveDataMock).toHaveBeenCalledWith('/zh/post-archive.json');
        expect(modulePreloadUrls()).toEqual([
            'http://localhost:3000/_astro/PostArchiveView.js',
            'http://localhost:3000/_astro/client.js',
        ]);

        trigger.dispatchEvent(new Event('pointerdown'));
        trigger.dispatchEvent(new FocusEvent('focus'));
        expect(modulePreloadUrls()).toHaveLength(2);
    });

    it('keeps the idle path data-only', async () => {
        renderArchiveShell();
        await initialize();

        await vi.advanceTimersByTimeAsync(7000);

        expect(preloadPostArchiveDataMock).toHaveBeenCalledWith('/zh/post-archive.json');
        expect(modulePreloadUrls()).toEqual([]);
    });

    it('rejects cross-origin and non-http module URLs', async () => {
        const trigger = renderArchiveShell({
            componentUrl: 'https://cdn.example.com/PostArchiveView.js',
            rendererUrl: 'javascript:alert(1)',
        });
        await initialize();

        trigger.dispatchEvent(new Event('pointerdown'));

        expect(preloadPostArchiveDataMock).toHaveBeenCalledWith('/zh/post-archive.json');
        expect(modulePreloadUrls()).toEqual([]);
    });

    it('preloads the visible archive immediately on a direct list URL', async () => {
        renderArchiveShell();
        window.history.replaceState({}, '', '/zh/post-view?view=list');

        await initialize();

        expect(preloadPostArchiveDataMock).toHaveBeenCalledWith('/zh/post-archive.json');
        expect(modulePreloadUrls()).toHaveLength(2);
    });
});
