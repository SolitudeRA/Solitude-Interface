import { preloadPostArchiveData } from '@lib/postArchiveDataClient';

interface IdleDeadlineLike {
    readonly didTimeout: boolean;
    timeRemaining(): number;
}

type IdleCallback = (deadline: IdleDeadlineLike) => void;

type IdleWindow = Window & {
    requestIdleCallback?: (callback: IdleCallback, options?: { timeout?: number }) => number;
    cancelIdleCallback?: (handle: number) => void;
};

let initialized = false;
let delayHandle: number | undefined;
let idleHandle: number | undefined;
let idleUsesRequestIdleCallback = false;

const ARCHIVE_ISLAND_SELECTOR = 'astro-island[component-url][renderer-url]';

function getArchiveUrl(): string | null {
    return (
        document.querySelector<HTMLElement>('[data-post-archive-source]')?.dataset
            .postArchiveSource ?? null
    );
}

function clearScheduledPreload(): void {
    if (delayHandle !== undefined) {
        window.clearTimeout(delayHandle);
        delayHandle = undefined;
    }
    if (idleHandle === undefined) return;
    const idleWindow = window as IdleWindow;
    if (idleUsesRequestIdleCallback) idleWindow.cancelIdleCallback?.(idleHandle);
    else window.clearTimeout(idleHandle);
    idleHandle = undefined;
}

function preloadData(): void {
    clearScheduledPreload();
    const url = getArchiveUrl();
    if (url) preloadPostArchiveData(url);
}

function toSameOriginModuleUrl(value: string | null): URL | null {
    if (!value) return null;

    try {
        const url = new URL(value, window.location.href);
        if (url.origin !== window.location.origin) return null;
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
        return url;
    } catch {
        return null;
    }
}

function hasModulePreload(url: URL): boolean {
    return Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="modulepreload"]')).some(
        (link) => link.href === url.href
    );
}

function preloadArchiveIslandModules(): void {
    const archiveRoot = document.querySelector<HTMLElement>('[data-post-archive-source]');
    const island = archiveRoot?.querySelector<HTMLElement>(ARCHIVE_ISLAND_SELECTOR);
    if (!island) return;

    const moduleUrls = [
        toSameOriginModuleUrl(island.getAttribute('component-url')),
        toSameOriginModuleUrl(island.getAttribute('renderer-url')),
    ];

    moduleUrls.forEach((url) => {
        if (!url || hasModulePreload(url)) return;
        const link = document.createElement('link');
        link.rel = 'modulepreload';
        link.href = url.href;
        document.head.append(link);
    });
}

function preloadOnIntent(): void {
    preloadData();
    preloadArchiveIslandModules();
}

function scheduleIdlePreload(): void {
    if (delayHandle !== undefined || idleHandle !== undefined) return;

    // Give first paint, fonts, and gallery hero images a quiet window before opportunistic JSON.
    // Pointer/focus intent bypasses this delay and also warms the lazy island modules.
    delayHandle = window.setTimeout(() => {
        delayHandle = undefined;
        const idleWindow = window as IdleWindow;
        const run = () => {
            idleHandle = undefined;
            preloadData();
        };
        idleUsesRequestIdleCallback = Boolean(idleWindow.requestIdleCallback);
        idleHandle = idleWindow.requestIdleCallback
            ? idleWindow.requestIdleCallback(run, { timeout: 2000 })
            : window.setTimeout(run, 2000);
    }, 5000);
}

function bindPreloadTriggers(): void {
    const url = getArchiveUrl();
    clearScheduledPreload();
    if (!url) return;

    document
        .querySelectorAll<HTMLElement>('[data-view-toggle="list"], [data-view-switch="list"]')
        .forEach((trigger) => {
            if (trigger.dataset.archivePreloadBound === '1') return;
            trigger.dataset.archivePreloadBound = '1';
            trigger.addEventListener('pointerenter', preloadOnIntent, {
                once: true,
                passive: true,
            });
            trigger.addEventListener('pointerdown', preloadOnIntent, {
                once: true,
                passive: true,
            });
            trigger.addEventListener('focus', preloadOnIntent, { once: true, passive: true });
        });

    if (new URLSearchParams(window.location.search).get('view') === 'list') {
        preloadOnIntent();
        return;
    }

    scheduleIdlePreload();
}

export function initPostArchivePreload(): void {
    if (initialized) {
        bindPreloadTriggers();
        return;
    }
    initialized = true;
    document.addEventListener('astro:page-load', bindPreloadTriggers);
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindPreloadTriggers, { once: true });
    } else {
        bindPreloadTriggers();
    }
}
