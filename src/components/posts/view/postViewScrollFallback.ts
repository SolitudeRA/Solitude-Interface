import { isPostViewPath } from '@lib/navigation/routeModel';
import { bindPostViewGallery } from './postViewGalleryController';

type PostViewScrollWindow = Window & {
    __solitudePostViewScrollReady?: boolean;
};

const activeGalleryCleanups = new Set<() => void>();

function bindPostViewScroll(): void {
    if (!isPostViewPath(window.location.pathname)) return;

    document.querySelectorAll<HTMLElement>('[data-post-view-gallery]').forEach((gallery) => {
        const cleanup = bindPostViewGallery(gallery);
        if (cleanup) activeGalleryCleanups.add(cleanup);
    });
}

function cleanupPostViewScroll(): void {
    activeGalleryCleanups.forEach((cleanup) => cleanup());
    activeGalleryCleanups.clear();
}

export function initPostViewScrollFallback(): void {
    const postViewWindow = window as PostViewScrollWindow;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindPostViewScroll, { once: true });
    } else {
        bindPostViewScroll();
    }

    if (!postViewWindow.__solitudePostViewScrollReady) {
        postViewWindow.__solitudePostViewScrollReady = true;
        document.addEventListener('astro:before-swap', cleanupPostViewScroll);
        document.addEventListener('astro:page-load', bindPostViewScroll);
    }
}

export { bindPostViewGallery } from './postViewGalleryController';
