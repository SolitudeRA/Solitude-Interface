// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bindPostViewGallery } from './postViewGalleryController';

type FrameCallback = (timestamp: number) => void;

let frameCallbacks: FrameCallback[] = [];

function flushFrames(): void {
    let timestamp = 16;
    while (frameCallbacks.length > 0) {
        const callbacks = frameCallbacks;
        frameCallbacks = [];
        callbacks.forEach((callback) => callback(timestamp));
        timestamp += 16;
    }
}

function setDimension(
    element: HTMLElement,
    property: 'clientWidth' | 'scrollWidth',
    value: number
) {
    Object.defineProperty(element, property, { configurable: true, value });
}

function renderGallery(cardCount = 3): {
    root: HTMLElement;
    container: HTMLElement;
    scrollBy: ReturnType<typeof vi.fn>;
    scrollTo: ReturnType<typeof vi.fn>;
} {
    document.body.innerHTML = `
        <div data-post-view-gallery>
            <div data-post-view-mask="left" data-can-scroll="false"></div>
            <div data-post-view-mask="right" data-can-scroll="false"></div>
            <button data-post-view-scroll-control="left"></button>
            <button data-post-view-scroll-control="right"></button>
            <div data-post-view-scroll style="column-gap: 60px; padding-left: 20px">
                ${Array.from({ length: cardCount }, () => '<a class="post-card-wrapper"></a>').join('')}
            </div>
            <div data-post-view-overview>
                <div data-post-view-overview-bloom></div>
                <div data-post-view-overview-core></div>
                <div data-post-view-overview-head></div>
            </div>
            <div data-post-view-pagination>
                <span data-post-view-status></span>
                <div class="pvp-timeline">
                    <div data-post-view-track>
                        ${Array.from({ length: 10 }, (_, index) => `<button data-post-view-marker="${index}"></button>`).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    const root = document.querySelector<HTMLElement>('[data-post-view-gallery]')!;
    const container = root.querySelector<HTMLElement>('[data-post-view-scroll]')!;
    setDimension(container, 'clientWidth', 400);
    setDimension(container, 'scrollWidth', 1500);
    setDimension(root.querySelector<HTMLElement>('.pvp-timeline')!, 'clientWidth', 390);
    root.querySelectorAll<HTMLElement>('.post-card-wrapper').forEach((card) => {
        card.getBoundingClientRect = () =>
            ({ width: 300, height: 600, left: 0, right: 300, top: 0, bottom: 600 }) as DOMRect;
    });
    const overview = root.querySelector<HTMLElement>('[data-post-view-overview]')!;
    overview.getBoundingClientRect = () =>
        ({ width: 1000, height: 16, left: 0, right: 1000, top: 0, bottom: 16 }) as DOMRect;

    const scrollBy = vi.fn((options: { left?: number }) => {
        container.scrollLeft += options.left ?? 0;
    });
    const scrollTo = vi.fn((options: { left?: number }) => {
        container.scrollLeft = options.left ?? 0;
    });
    Object.assign(container, { scrollBy, scrollTo });

    return { root, container, scrollBy, scrollTo };
}

beforeEach(() => {
    frameCallbacks = [];
    Object.defineProperty(window, 'requestAnimationFrame', {
        configurable: true,
        value: vi.fn((callback: FrameCallback) => {
            frameCallbacks.push(callback);
            return frameCallbacks.length;
        }),
    });
    Object.defineProperty(window, 'cancelAnimationFrame', {
        configurable: true,
        value: vi.fn(),
    });
    Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: vi.fn((query: string) => ({
            matches: query === '(min-width: 1024px)',
            media: query,
            onchange: null,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            addListener: vi.fn(),
            removeListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
    Object.defineProperty(globalThis, 'ResizeObserver', {
        configurable: true,
        value: class ResizeObserverMock {
            observe = vi.fn();
            disconnect = vi.fn();
        },
    });
    sessionStorage.clear();
    document.documentElement.removeAttribute('data-post-view-scrolling');
});

afterEach(() => {
    vi.useRealTimers();
    document.documentElement.removeAttribute('data-post-view-scrolling');
    document.body.innerHTML = '';
});

describe('post view gallery progressive enhancement', () => {
    it('coalesces a vertical wheel burst into one cached-stride page step', () => {
        const { root, container, scrollBy } = renderGallery();
        const cleanup = bindPostViewGallery(root)!;
        flushFrames();

        const firstCard = container.querySelector<HTMLElement>('.post-card-wrapper')!;
        const rect = vi.spyOn(firstCard, 'getBoundingClientRect');
        const events = [90, 110, 80].map(
            (deltaY) => new WheelEvent('wheel', { deltaY, bubbles: true, cancelable: true })
        );
        events.forEach((event) => container.dispatchEvent(event));

        expect(events.every((event) => event.defaultPrevented)).toBe(true);
        expect(scrollBy).not.toHaveBeenCalled();
        flushFrames();
        expect(scrollBy).toHaveBeenCalledTimes(1);
        expect(scrollBy).toHaveBeenCalledWith({ left: 360, behavior: 'smooth' });
        expect(rect).not.toHaveBeenCalled();
        cleanup();
    });

    it('continues paging under sustained wheel input instead of requiring a pause', () => {
        const { root, container, scrollBy } = renderGallery(10);
        setDimension(container, 'scrollWidth', 4000);
        const cleanup = bindPostViewGallery(root)!;
        const now = vi.spyOn(performance, 'now');
        flushFrames();

        for (let timestamp = 100; timestamp <= 1300; timestamp += 100) {
            now.mockReturnValue(timestamp);
            const event = new WheelEvent('wheel', {
                deltaY: 100,
                bubbles: true,
                cancelable: true,
            });
            container.dispatchEvent(event);
            flushFrames();
            expect(event.defaultPrevented).toBe(true);
        }
        expect(scrollBy).toHaveBeenCalledTimes(4);
        expect(container.scrollLeft).toBe(1440);
        cleanup();
        now.mockRestore();
    });

    it('reverses the page direction without waiting for the burst timeout', () => {
        const { root, container, scrollBy } = renderGallery();
        container.scrollLeft = 360;
        const cleanup = bindPostViewGallery(root)!;
        const now = vi.spyOn(performance, 'now');
        flushFrames();

        now.mockReturnValue(100);
        container.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, cancelable: true }));
        flushFrames();
        now.mockReturnValue(120);
        container.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, cancelable: true }));
        flushFrames();

        expect(scrollBy.mock.calls).toEqual([
            [{ left: 360, behavior: 'smooth' }],
            [{ left: -360, behavior: 'smooth' }],
        ]);
        expect(container.scrollLeft).toBe(360);
        cleanup();
        now.mockRestore();
    });

    it('leaves precise horizontal deltas to native overflow scrolling', () => {
        const { root, container, scrollBy } = renderGallery();
        const cleanup = bindPostViewGallery(root)!;
        flushFrames();

        const first = new WheelEvent('wheel', {
            deltaX: 12,
            deltaY: 1,
            bubbles: true,
            cancelable: true,
        });
        const second = new WheelEvent('wheel', {
            deltaX: 18,
            deltaY: 2,
            bubbles: true,
            cancelable: true,
        });
        container.dispatchEvent(first);
        container.dispatchEvent(second);
        flushFrames();

        expect(first.defaultPrevented).toBe(false);
        expect(second.defaultPrevented).toBe(false);
        expect(scrollBy).not.toHaveBeenCalled();
        cleanup();
    });

    it('does not rewrite stable timeline and control state on every scroll frame', () => {
        const { root, container } = renderGallery();
        const cleanup = bindPostViewGallery(root)!;
        flushFrames();

        const marker = root.querySelector<HTMLElement>('[data-post-view-marker="0"]')!;
        const rightControl = root.querySelector<HTMLButtonElement>(
            '[data-post-view-scroll-control="right"]'
        )!;
        const markerStyleWrite = vi.spyOn(marker.style, 'setProperty');
        const controlAttributeWrite = vi.spyOn(rightControl, 'setAttribute');

        container.dispatchEvent(new Event('scroll'));
        flushFrames();

        expect(markerStyleWrite).not.toHaveBeenCalled();
        expect(controlAttributeWrite).not.toHaveBeenCalled();
        cleanup();
    });

    it('writes the scrolling attribute only at active and idle edges', () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        const { root, container } = renderGallery();
        const cleanup = bindPostViewGallery(root)!;
        flushFrames();
        const setAttribute = vi.spyOn(container, 'setAttribute');
        const removeAttribute = vi.spyOn(container, 'removeAttribute');
        const htmlSetAttribute = vi.spyOn(document.documentElement, 'setAttribute');
        const htmlRemoveAttribute = vi.spyOn(document.documentElement, 'removeAttribute');

        container.dispatchEvent(new Event('scroll'));
        container.dispatchEvent(new Event('scroll'));

        expect(
            setAttribute.mock.calls.filter(([name]) => name === 'data-post-view-scrolling')
        ).toHaveLength(1);
        expect(container.dataset.postViewScrolling).toBe('true');
        expect(
            htmlSetAttribute.mock.calls.filter(([name]) => name === 'data-post-view-scrolling')
        ).toHaveLength(1);
        expect(document.documentElement.dataset.postViewScrolling).toBe('true');

        vi.advanceTimersByTime(159);
        expect(container.dataset.postViewScrolling).toBe('true');
        vi.advanceTimersByTime(1);

        expect(container.dataset.postViewScrolling).toBeUndefined();
        expect(
            removeAttribute.mock.calls.filter(([name]) => name === 'data-post-view-scrolling')
        ).toHaveLength(1);
        expect(
            htmlRemoveAttribute.mock.calls.filter(([name]) => name === 'data-post-view-scrolling')
        ).toHaveLength(1);
        cleanup();
        vi.useRealTimers();
    });

    it('uses instant explicit paging when reduced motion is requested', () => {
        vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
            matches: query === '(prefers-reduced-motion: reduce)',
            media: query,
            onchange: null,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            addListener: vi.fn(),
            removeListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }));
        const { root, scrollBy, scrollTo } = renderGallery();
        const cleanup = bindPostViewGallery(root)!;
        flushFrames();

        root.querySelector<HTMLButtonElement>('[data-post-view-scroll-control="right"]')?.click();
        root.querySelector<HTMLButtonElement>('[data-post-view-marker="2"]')?.click();

        expect(scrollBy).toHaveBeenLastCalledWith({ left: 320, behavior: 'auto' });
        expect(scrollTo).toHaveBeenLastCalledWith({ left: 690, behavior: 'auto' });
        cleanup();
    });

    it('updates controls, composited timeline, and desktop overview from one scroll frame', () => {
        const { root, container } = renderGallery();
        const overviewRect = vi.spyOn(
            root.querySelector<HTMLElement>('[data-post-view-overview]')!,
            'getBoundingClientRect'
        );
        const cleanup = bindPostViewGallery(root)!;
        flushFrames();

        container.scrollLeft = 360;
        container.dispatchEvent(new Event('scroll'));
        flushFrames();

        expect(
            root.querySelector<HTMLElement>('[data-post-view-mask="left"]')?.dataset.canScroll
        ).toBe('true');
        expect(
            root.querySelector<HTMLElement>('[data-post-view-scroll-control="right"]')?.tabIndex
        ).toBe(0);
        expect(
            root
                .querySelector<HTMLElement>('[data-post-view-marker="1"]')
                ?.getAttribute('aria-current')
        ).toBe('true');
        expect(
            root
                .querySelector<HTMLElement>('[data-post-view-track]')
                ?.style.getPropertyValue('--pvp-track-x')
        ).toBe('-78.00px');
        expect(
            root.querySelector<HTMLElement>('[data-post-view-overview-core]')?.style.transform
        ).toBe('scaleX(0.32727)');
        expect(
            root.querySelector<HTMLElement>('[data-post-view-marker="9"]')?.style.pointerEvents
        ).toBe('none');
        expect(root.querySelector<HTMLElement>('[data-post-view-status]')?.textContent).toContain(
            '第 2'
        );
        expect(overviewRect).not.toHaveBeenCalled();
        cleanup();
    });

    it('formats localized status and marker labels from the SSR shell templates', () => {
        const { root, container } = renderGallery();
        root.dataset.postViewStatusTemplate = 'Viewing post {current} of {total}';
        root.dataset.postViewCurrentLabelTemplate = 'Post {current} of {total}';
        root.dataset.postViewJumpLabelTemplate = 'Jump to post {current} of {total}';
        const cleanup = bindPostViewGallery(root)!;
        flushFrames();

        container.scrollLeft = 360;
        container.dispatchEvent(new Event('scroll'));
        flushFrames();

        expect(root.querySelector<HTMLElement>('[data-post-view-status]')?.textContent).toBe(
            'Viewing post 2 of 10'
        );
        expect(
            root
                .querySelector<HTMLElement>('[data-post-view-marker="1"]')
                ?.getAttribute('aria-label')
        ).toBe('Post 2 of 10');
        expect(
            root
                .querySelector<HTMLElement>('[data-post-view-marker="2"]')
                ?.getAttribute('aria-label')
        ).toBe('Jump to post 3 of 10');
        cleanup();
    });

    it('hides clipped markers from keyboard focus and uses valid ARIA after a round trip', () => {
        const { root, container } = renderGallery(10);
        setDimension(container, 'scrollWidth', 4000);
        const cleanup = bindPostViewGallery(root)!;
        flushFrames();
        const first = root.querySelector<HTMLButtonElement>('[data-post-view-marker="0"]')!;
        const clipped = root.querySelector<HTMLButtonElement>('[data-post-view-marker="4"]')!;

        expect(first.tabIndex).toBe(0);
        expect(first.hasAttribute('aria-hidden')).toBe(false);
        expect(clipped.tabIndex).toBe(-1);
        expect(clipped.getAttribute('aria-hidden')).toBe('true');

        container.scrollLeft = 8 * 360;
        container.dispatchEvent(new Event('scroll'));
        flushFrames();
        expect(first.tabIndex).toBe(-1);
        expect(first.getAttribute('aria-hidden')).toBe('true');

        container.scrollLeft = 0;
        container.dispatchEvent(new Event('scroll'));
        flushFrames();
        expect(first.tabIndex).toBe(0);
        expect(first.hasAttribute('aria-hidden')).toBe(false);

        container.scrollLeft = 8 * 360;
        container.dispatchEvent(new Event('scroll'));
        flushFrames();
        expect(first.getAttribute('aria-hidden')).toBe('true');
        cleanup();
    });

    it('does not write the hidden overview on mobile', () => {
        vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            addListener: vi.fn(),
            removeListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }));
        const { root, container } = renderGallery();
        const cleanup = bindPostViewGallery(root)!;

        container.scrollLeft = 360;
        container.dispatchEvent(new Event('scroll'));
        flushFrames();

        expect(
            root.querySelector<HTMLElement>('[data-post-view-overview-core]')?.style.transform
        ).toBe('');
        cleanup();
    });

    it('restores and consumes the stored gallery position without React hydration', () => {
        sessionStorage.setItem('solitude:post-view-scroll-left', '420');
        const { root, container } = renderGallery();
        const cleanup = bindPostViewGallery(root)!;

        expect(container.scrollLeft).toBe(420);
        expect(sessionStorage.getItem('solitude:post-view-scroll-left')).toBeNull();
        cleanup();
    });

    it('keeps arrow and marker controls keyboard-clickable', () => {
        const { root, scrollBy, scrollTo } = renderGallery();
        const cleanup = bindPostViewGallery(root)!;
        flushFrames();

        root.querySelector<HTMLButtonElement>('[data-post-view-scroll-control="right"]')?.click();
        root.querySelector<HTMLButtonElement>('[data-post-view-marker="2"]')?.click();

        expect(scrollBy).toHaveBeenLastCalledWith({ left: 320, behavior: 'smooth' });
        expect(scrollTo).toHaveBeenLastCalledWith({ left: 690, behavior: 'smooth' });
        cleanup();
    });
});
