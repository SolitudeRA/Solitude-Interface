import {
    classifyHorizontalWheel,
    registerPageWheelIntent,
    type PageWheelBurstState,
} from '@components/common/lib/horizontalWheel';
import {
    computeCompositedTimelineLayout,
    computeScrollProgress,
    DEFAULT_GEOMETRY,
} from './paginationGeometry';

const CARD_SELECTOR = '.post-card-wrapper';
const SCROLL_KEY = 'solitude:post-view-scroll-left';
const SCROLL_IDLE_MS = 160;

interface ScrollMetrics {
    totalItems: number;
    itemWidth: number;
    itemGap: number;
    stride: number;
    paddingLeft: number;
    clientWidth: number;
}

interface GalleryElements {
    container: HTMLElement;
    leftMask: HTMLElement | null;
    rightMask: HTMLElement | null;
    leftControl: HTMLButtonElement | null;
    rightControl: HTMLButtonElement | null;
    track: HTMLElement | null;
    timeline: HTMLElement | null;
    markers: HTMLButtonElement[];
    status: HTMLElement | null;
    overview: HTMLElement | null;
    bloom: HTMLElement | null;
    core: HTMLElement | null;
    head: HTMLElement | null;
}

interface WheelFrameState {
    frame: number | null;
    pageDirection: -1 | 0 | 1;
    burst: PageWheelBurstState | null;
}

function clampIndex(index: number, total: number): number {
    return Math.min(Math.max(index, 0), Math.max(total - 1, 0));
}

function readElements(root: HTMLElement): GalleryElements | null {
    const container = root.querySelector<HTMLElement>('[data-post-view-scroll]');
    if (!container) return null;

    return {
        container,
        leftMask: root.querySelector('[data-post-view-mask="left"]'),
        rightMask: root.querySelector('[data-post-view-mask="right"]'),
        leftControl: root.querySelector('[data-post-view-scroll-control="left"]'),
        rightControl: root.querySelector('[data-post-view-scroll-control="right"]'),
        track: root.querySelector('[data-post-view-track]'),
        timeline: root.querySelector('.pvp-timeline'),
        markers: Array.from(root.querySelectorAll('[data-post-view-marker]')),
        status: root.querySelector('[data-post-view-status]'),
        overview: root.querySelector('[data-post-view-overview]'),
        bloom: root.querySelector('[data-post-view-overview-bloom]'),
        core: root.querySelector('[data-post-view-overview-core]'),
        head: root.querySelector('[data-post-view-overview-head]'),
    };
}

function setCanScroll(element: HTMLElement | null, canScroll: boolean): void {
    if (!element) return;
    element.dataset.canScroll = String(canScroll);

    if (element instanceof HTMLButtonElement) {
        element.tabIndex = canScroll ? 0 : -1;
        element.setAttribute('aria-hidden', String(!canScroll));
    }
}

function readScrollMetrics(
    container: HTMLElement,
    cachedMetrics: ScrollMetrics | null
): ScrollMetrics {
    const totalItems = container.querySelectorAll<HTMLElement>(CARD_SELECTOR).length;
    if (
        cachedMetrics &&
        cachedMetrics.totalItems === totalItems &&
        cachedMetrics.clientWidth === container.clientWidth
    ) {
        return cachedMetrics;
    }

    const item = container.querySelector<HTMLElement>(CARD_SELECTOR);
    const styles = window.getComputedStyle(container);
    const itemWidth = item?.getBoundingClientRect().width || 300;
    const itemGap = Number.parseFloat(styles.columnGap) || 60;
    const paddingLeft = Number.parseFloat(styles.paddingLeft) || 0;

    return {
        totalItems,
        itemWidth,
        itemGap,
        stride: itemWidth + itemGap,
        paddingLeft,
        clientWidth: container.clientWidth,
    };
}

function getVisibleState(
    container: HTMLElement,
    metrics: ScrollMetrics
): {
    activeIndex: number;
    visibleIndices: number[];
} {
    if (metrics.totalItems === 0) return { activeIndex: 0, visibleIndices: [] };

    const viewportLeft = container.scrollLeft;
    const viewportRight = viewportLeft + container.clientWidth;
    const viewportCenter = viewportLeft + container.clientWidth / 2;
    const firstItemCenter = metrics.paddingLeft + metrics.itemWidth / 2;
    const activeIndex = clampIndex(
        Math.round((viewportCenter - firstItemCenter) / metrics.stride),
        metrics.totalItems
    );
    const visibleIndices: number[] = [];

    for (let index = 0; index < metrics.totalItems; index += 1) {
        const itemLeft = metrics.paddingLeft + index * metrics.stride;
        const itemRight = itemLeft + metrics.itemWidth;
        const visibleWidth = Math.max(
            0,
            Math.min(itemRight, viewportRight) - Math.max(itemLeft, viewportLeft)
        );
        if (visibleWidth / metrics.itemWidth > 0.3) visibleIndices.push(index);
    }

    return { activeIndex, visibleIndices };
}

function glowIntensity(velocity: number): number {
    const calm = Math.exp(-Math.abs(velocity) * 2.5);
    return 0.2 + 0.8 * calm;
}

function formatGalleryLabel(template: string, current: number, total: number): string {
    return template.replace('{current}', String(current)).replace('{total}', String(total));
}

/**
 * 为一个 SSR Gallery 壳绑定渐进增强。返回清理函数，供 Astro swap 主动释放观察器。
 */
export function bindPostViewGallery(root: HTMLElement): (() => void) | null {
    if (root.dataset.postViewEnhanced === 'true') return null;

    const elements = readElements(root);
    if (!elements) return null;

    const { container } = elements;
    const statusTemplate =
        root.dataset.postViewStatusTemplate ?? '正在浏览第 {current} 篇，共 {total} 篇';
    const currentLabelTemplate = root.dataset.postViewCurrentLabelTemplate ?? '第 {current} 篇文章';
    const jumpLabelTemplate = root.dataset.postViewJumpLabelTemplate ?? '跳转到第 {current} 篇文章';
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    let metrics: ScrollMetrics | null = null;
    let updateFrame: number | null = null;
    let scrollIdleTimer: number | null = null;
    let restoreSnapFrame: number | null = null;
    let restoreBehaviorFrame: number | null = null;
    let lastProgress = 0;
    let lastProgressTime = performance.now();
    let lastTimelineSignature: string | null = null;
    let lastCanScrollLeft: boolean | null = null;
    let lastCanScrollRight: boolean | null = null;
    const wheel: WheelFrameState = {
        frame: null,
        pageDirection: 0,
        burst: null,
    };

    const getMetrics = (): ScrollMetrics => {
        metrics = readScrollMetrics(container, metrics);
        return metrics;
    };

    const invalidateMetrics = (): void => {
        metrics = null;
    };

    const updateOverview = (): void => {
        if (!desktopQuery.matches || !elements.overview) return;

        const progress = computeScrollProgress(
            container.scrollLeft,
            container.scrollWidth,
            container.clientWidth
        );
        const now = performance.now();
        const elapsedSeconds = Math.max((now - lastProgressTime) / 1000, 1 / 120);
        const velocity = (progress - lastProgress) / elapsedSeconds;
        const glow = glowIntensity(velocity);
        // overview 固定贴合视窗左右边缘；直接用 innerWidth，避免滚动帧读取 rect 强制布局。
        const overviewWidth = window.innerWidth;

        elements.bloom?.style.setProperty('transform', `scaleX(${progress.toFixed(5)})`);
        elements.core?.style.setProperty('transform', `scaleX(${progress.toFixed(5)})`);
        elements.head?.style.setProperty(
            'transform',
            `translate3d(${(progress * overviewWidth).toFixed(2)}px, 0, 0) translateX(-50%)`
        );
        elements.bloom?.style.setProperty('opacity', glow.toFixed(3));
        elements.head?.style.setProperty('opacity', glow.toFixed(3));

        lastProgress = progress;
        lastProgressTime = now;
    };

    const updateTimeline = (activeIndex: number, visibleIndices: number[]): void => {
        const layout = computeCompositedTimelineLayout(
            elements.markers.length,
            activeIndex,
            visibleIndices,
            DEFAULT_GEOMETRY
        );
        const timelineWidth = elements.timeline?.clientWidth ?? 0;
        const slotWidth = DEFAULT_GEOMETRY.barW + DEFAULT_GEOMETRY.gap;
        elements.track?.style.setProperty('--pvp-track-x', `${layout.translateX.toFixed(2)}px`);

        layout.markers.forEach((marker, index) => {
            const element = elements.markers[index];
            if (!element) return;

            element.style.setProperty('--pvp-marker-scale', marker.scaleX.toFixed(4));
            element.style.opacity = marker.opacity.toFixed(3);
            // Fixed slots can lie outside the clipped timeline even inside the logical window.
            // Keep their focus outlines inside the visible strip instead of adding invisible stops.
            const fitsTimeline =
                timelineWidth > 0 &&
                Math.abs(index - activeIndex) * slotWidth +
                    (marker.scaleX * DEFAULT_GEOMETRY.barW) / 2 +
                    5 <=
                    timelineWidth / 2;
            const isAccessible = marker.inWindow && marker.opacity > 0 && fitsTimeline;
            element.style.pointerEvents = isAccessible ? 'auto' : 'none';
            element.tabIndex = isAccessible ? 0 : -1;
            if (isAccessible) {
                element.removeAttribute('aria-hidden');
            } else {
                element.setAttribute('aria-hidden', 'true');
            }
            element.classList.toggle('is-active', marker.isActive);

            if (marker.isActive) {
                element.setAttribute('aria-current', 'true');
                element.setAttribute(
                    'aria-label',
                    formatGalleryLabel(currentLabelTemplate, index + 1, elements.markers.length)
                );
            } else {
                element.removeAttribute('aria-current');
                element.setAttribute(
                    'aria-label',
                    formatGalleryLabel(jumpLabelTemplate, index + 1, elements.markers.length)
                );
            }
        });

        if (elements.status && elements.markers.length > 0) {
            elements.status.textContent = formatGalleryLabel(
                statusTemplate,
                activeIndex + 1,
                elements.markers.length
            );
        }
    };

    const update = (): void => {
        updateFrame = null;
        const currentMetrics = getMetrics();
        const maxScrollLeft = Math.max(container.scrollWidth - container.clientWidth, 0);
        const canScrollLeft = container.scrollLeft > 1;
        const canScrollRight = container.scrollLeft < maxScrollLeft - 1;
        const { activeIndex, visibleIndices } = getVisibleState(container, currentMetrics);

        if (canScrollLeft !== lastCanScrollLeft) {
            lastCanScrollLeft = canScrollLeft;
            setCanScroll(elements.leftMask, canScrollLeft);
            setCanScroll(elements.leftControl, canScrollLeft);
        }
        if (canScrollRight !== lastCanScrollRight) {
            lastCanScrollRight = canScrollRight;
            setCanScroll(elements.rightMask, canScrollRight);
            setCanScroll(elements.rightControl, canScrollRight);
        }

        const timelineSignature = `${activeIndex}:${visibleIndices.join(',')}`;
        if (timelineSignature !== lastTimelineSignature) {
            lastTimelineSignature = timelineSignature;
            updateTimeline(activeIndex, visibleIndices);
        }
        updateOverview();
    };

    const scheduleUpdate = (): void => {
        if (updateFrame !== null) return;
        updateFrame = window.requestAnimationFrame(update);
    };

    const markScrolling = (): void => {
        if (container.dataset.postViewScrolling !== 'true') {
            container.setAttribute('data-post-view-scrolling', 'true');
        }
        if (document.documentElement.dataset.postViewScrolling !== 'true') {
            document.documentElement.setAttribute('data-post-view-scrolling', 'true');
        }
        if (scrollIdleTimer !== null) window.clearTimeout(scrollIdleTimer);
        scrollIdleTimer = window.setTimeout(() => {
            scrollIdleTimer = null;
            if (container.hasAttribute('data-post-view-scrolling')) {
                container.removeAttribute('data-post-view-scrolling');
            }
            if (document.documentElement.hasAttribute('data-post-view-scrolling')) {
                document.documentElement.removeAttribute('data-post-view-scrolling');
            }
            scheduleUpdate();
        }, SCROLL_IDLE_MS);
    };

    const handleScroll = (): void => {
        markScrolling();
        scheduleUpdate();
    };

    const isAtBoundary = (direction: -1 | 1): boolean => {
        const maxScrollLeft = Math.max(container.scrollWidth - container.clientWidth, 0);
        return direction < 0 ? container.scrollLeft <= 0 : container.scrollLeft >= maxScrollLeft;
    };

    const flushWheel = (): void => {
        wheel.frame = null;
        const pageDirection = wheel.pageDirection;
        wheel.pageDirection = 0;

        if (pageDirection !== 0) {
            container.scrollBy({
                left: pageDirection * getMetrics().stride,
                behavior: reducedMotionQuery.matches ? 'auto' : 'smooth',
            });
        }

        scheduleUpdate();
    };

    const scheduleWheel = (): void => {
        if (wheel.frame !== null) return;
        wheel.frame = window.requestAnimationFrame(flushWheel);
    };

    const handleWheel = (event: WheelEvent): void => {
        const intent = classifyHorizontalWheel({
            deltaX: event.deltaX,
            deltaY: event.deltaY,
        });
        if (intent.kind === 'none' || intent.kind === 'native') return;
        if (isAtBoundary(intent.direction)) return;

        event.preventDefault();
        event.stopPropagation();

        const burst = registerPageWheelIntent(wheel.burst, intent.direction, performance.now());
        wheel.burst = burst.state;
        if (!burst.shouldPage) return;

        wheel.pageDirection = intent.direction;
        scheduleWheel();
    };

    const scrollByPage = (direction: -1 | 1): void => {
        container.scrollBy({
            left: direction * container.clientWidth * 0.8,
            behavior: reducedMotionQuery.matches ? 'auto' : 'smooth',
        });
    };

    const scrollToIndex = (index: number): void => {
        const currentMetrics = getMetrics();
        if (index < 0 || index >= currentMetrics.totalItems) return;
        const itemCenter =
            currentMetrics.paddingLeft +
            index * currentMetrics.stride +
            currentMetrics.itemWidth / 2;
        const maxScrollLeft = Math.max(container.scrollWidth - container.clientWidth, 0);
        const left = Math.min(Math.max(itemCenter - container.clientWidth / 2, 0), maxScrollLeft);
        container.scrollTo({
            left,
            behavior: reducedMotionQuery.matches ? 'auto' : 'smooth',
        });
    };

    const handleMarkerClick = (event: Event): void => {
        if (!(event.target instanceof Element)) return;
        const marker = event.target.closest<HTMLButtonElement>('[data-post-view-marker]');
        if (!marker || !elements.track?.contains(marker)) return;
        const index = Number.parseInt(marker.dataset.postViewMarker ?? '', 10);
        if (Number.isSafeInteger(index)) scrollToIndex(index);
    };

    const handleViewChange = (): void => {
        if (!root.isConnected) return;
        invalidateMetrics();
        scheduleUpdate();
    };

    const handleLeftControl = (): void => scrollByPage(-1);
    const handleRightControl = (): void => scrollByPage(1);

    elements.leftControl?.addEventListener('click', handleLeftControl);
    elements.rightControl?.addEventListener('click', handleRightControl);
    elements.track?.addEventListener('click', handleMarkerClick);
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('post-view-change', handleViewChange);

    const resizeObserver =
        typeof ResizeObserver === 'undefined'
            ? null
            : new ResizeObserver(() => {
                  invalidateMetrics();
                  lastTimelineSignature = null;
                  scheduleUpdate();
              });
    resizeObserver?.observe(container);
    if (elements.timeline) resizeObserver?.observe(elements.timeline);
    const firstItem = container.querySelector<HTMLElement>(CARD_SELECTOR);
    if (firstItem) resizeObserver?.observe(firstItem);

    const mutationObserver = new MutationObserver(() => {
        invalidateMetrics();
        scheduleUpdate();
    });
    mutationObserver.observe(container, { childList: true, subtree: true });

    try {
        const storedValue = sessionStorage.getItem(SCROLL_KEY);
        const storedScrollLeft = Number(storedValue);
        if (storedValue !== null && Number.isFinite(storedScrollLeft)) {
            const previousScrollBehavior = container.style.scrollBehavior;
            const previousScrollSnapType = container.style.scrollSnapType;

            container.dataset.postViewRestoring = 'true';
            container.style.scrollBehavior = 'auto';
            container.style.scrollSnapType = 'none';
            container.scrollLeft = Math.max(storedScrollLeft, 0);
            sessionStorage.removeItem(SCROLL_KEY);

            restoreSnapFrame = window.requestAnimationFrame(() => {
                restoreSnapFrame = null;
                if (previousScrollSnapType) {
                    container.style.scrollSnapType = previousScrollSnapType;
                } else {
                    container.style.removeProperty('scroll-snap-type');
                }

                restoreBehaviorFrame = window.requestAnimationFrame(() => {
                    restoreBehaviorFrame = null;
                    if (previousScrollBehavior) {
                        container.style.scrollBehavior = previousScrollBehavior;
                    } else {
                        container.style.removeProperty('scroll-behavior');
                    }
                    delete container.dataset.postViewRestoring;
                });
            });
        }
    } catch {
        // Storage can be disabled; the gallery remains usable from its initial position.
    }

    root.dataset.postViewEnhanced = 'true';
    scheduleUpdate();

    return () => {
        delete root.dataset.postViewEnhanced;
        if (container.hasAttribute('data-post-view-scrolling')) {
            container.removeAttribute('data-post-view-scrolling');
        }
        if (document.documentElement.hasAttribute('data-post-view-scrolling')) {
            document.documentElement.removeAttribute('data-post-view-scrolling');
        }
        if (updateFrame !== null) window.cancelAnimationFrame(updateFrame);
        if (wheel.frame !== null) window.cancelAnimationFrame(wheel.frame);
        if (restoreSnapFrame !== null) window.cancelAnimationFrame(restoreSnapFrame);
        if (restoreBehaviorFrame !== null) window.cancelAnimationFrame(restoreBehaviorFrame);
        if (scrollIdleTimer !== null) window.clearTimeout(scrollIdleTimer);
        resizeObserver?.disconnect();
        mutationObserver.disconnect();
        container.removeEventListener('wheel', handleWheel);
        container.removeEventListener('scroll', handleScroll);
        elements.leftControl?.removeEventListener('click', handleLeftControl);
        elements.rightControl?.removeEventListener('click', handleRightControl);
        elements.track?.removeEventListener('click', handleMarkerClick);
        window.removeEventListener('post-view-change', handleViewChange);
    };
}
