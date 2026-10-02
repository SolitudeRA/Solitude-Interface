// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    createProgressiveImageController,
    type ProgressiveImageController,
} from './progressiveImages';

const observers: IntersectionObserverMock[] = [];
type ObserverCallback = ConstructorParameters<typeof IntersectionObserver>[0];
type ObserverOptions = NonNullable<ConstructorParameters<typeof IntersectionObserver>[1]>;
class IntersectionObserverMock {
    readonly targets = new Set<Element>();
    constructor(
        private readonly callback: ObserverCallback,
        readonly options: ObserverOptions = {}
    ) {
        observers.push(this);
    }
    observe = (target: Element) => {
        this.targets.add(target);
    };
    unobserve = (target: Element) => {
        this.targets.delete(target);
    };
    disconnect = () => {
        this.targets.clear();
    };
    emit(targets: Element[]) {
        this.callback(
            targets
                .filter((target) => this.targets.has(target))
                .map(
                    (target) =>
                        ({
                            target,
                            isIntersecting: true,
                            intersectionRatio: 1,
                        }) as IntersectionObserverEntry
                ),
            this as unknown as IntersectionObserver
        );
    }
}

let controller: ProgressiveImageController;
function renderFrames(count: number): HTMLElement[] {
    const markup = (critical: boolean) => `<div data-progressive-observer-boundary>
        <span data-progressive-image data-progressive-phase="low" ${critical ? 'data-progressive-critical="true"' : ''}>
            <img data-progressive-low src="/low.webp">
            <img data-progressive-medium data-progressive-src="/medium.webp">
            <img data-progressive-high data-progressive-src="/high.webp">
        </span></div>`;
    document.body.innerHTML =
        markup(true) + Array.from({ length: count }, () => markup(false)).join('');
    return Array.from(
        document.querySelectorAll<HTMLElement>(
            '[data-progressive-image]:not([data-progressive-critical])'
        )
    );
}
function enterViewport(frames: HTMLElement[]) {
    observers
        .findLast((observer) => observer.options.rootMargin === '0px')!
        .emit(frames.map((frame) => frame.parentElement!));
}
function enterMargin(frames: HTMLElement[]) {
    observers
        .findLast((observer) => observer.options.rootMargin === '360px')!
        .emit(frames.map((frame) => frame.parentElement!));
}

beforeEach(() => {
    vi.useFakeTimers();
    observers.length = 0;
    vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
    Object.defineProperty(HTMLImageElement.prototype, 'decode', {
        configurable: true,
        value: vi.fn().mockResolvedValue(undefined),
    });
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(480);
    // Idle is still asynchronous, as in the browser, but deterministic for the scheduler tests.
    vi.stubGlobal('requestIdleCallback', (callback: () => void) => window.setTimeout(callback, 1));
    controller = createProgressiveImageController();
});

afterEach(() => {
    controller.dispose();
    document.body.replaceChildren();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('progressive image visibility scheduling', () => {
    it('upgrades every visible first-screen card before the decorative background high gate', async () => {
        const frames = renderFrames(7);
        controller.initialize();
        enterViewport(frames.slice(0, 5));
        await vi.advanceTimersByTimeAsync(1000);

        expect(frames.slice(0, 5).map((frame) => frame.dataset.progressivePhase)).toEqual(
            Array(5).fill('high')
        );
        expect(frames.slice(5).map((frame) => frame.dataset.progressivePhase)).toEqual([
            'low',
            'low',
        ]);
        expect(
            document.querySelector<HTMLElement>('[data-progressive-critical]')?.dataset
                .progressivePhase
        ).toBe('medium');
        expect(frames[0]!.querySelector<HTMLImageElement>('[data-progressive-low]')!.hidden).toBe(
            true
        );
    });

    it('promotes an already queued margin frame after repeated page-load initialization', async () => {
        const [frame] = renderFrames(1);
        controller.initialize();
        enterMargin([frame!]);
        await vi.advanceTimersByTimeAsync(400);
        expect(frame!.dataset.progressivePhase).toBe('low');

        controller.initialize();
        enterViewport([frame!]);
        await vi.advanceTimersByTimeAsync(600);
        expect(frame!.dataset.progressivePhase).toBe('high');
    });

    it('keeps margin-only images low while the user is continuously scrolling', async () => {
        const frames = renderFrames(2);
        controller.initialize();
        enterMargin(frames);
        for (let index = 0; index < 20; index++) {
            document.dispatchEvent(new Event('wheel'));
            await vi.advanceTimersByTimeAsync(100);
        }
        expect(frames.map((frame) => frame.dataset.progressivePhase)).toEqual(['low', 'low']);
        expect(frames[0]!.querySelector('[data-progressive-medium]')!.hasAttribute('src')).toBe(
            false
        );
    });

    it('does not activate waiting images from a detached page after navigation', async () => {
        const oldFrames = renderFrames(2);
        const oldBackground = document.querySelector<HTMLElement>('[data-progressive-critical]')!;
        controller.initialize();
        enterMargin(oldFrames);
        await vi.advanceTimersByTimeAsync(400);
        expect(oldFrames.every((frame) => frame.dataset.progressiveStarted === 'true')).toBe(true);

        const newFrames = renderFrames(1);
        controller.initialize();
        enterViewport(newFrames);
        // Let both the old 3.2-second card gate and 6-second background gate expire.
        await vi.advanceTimersByTimeAsync(8000);

        for (const frame of oldFrames) {
            expect(frame.isConnected).toBe(false);
            expect(frame.querySelector('[data-progressive-medium]')!.hasAttribute('src')).toBe(
                false
            );
            expect(frame.querySelector('[data-progressive-high]')!.hasAttribute('src')).toBe(false);
            expect(frame.dataset.progressivePhase).toBe('low');
        }
        expect(oldBackground.querySelector('[data-progressive-high]')!.hasAttribute('src')).toBe(
            false
        );
        expect(newFrames[0]!.dataset.progressivePhase).toBe('high');
    });

    it('promotes a newly visible frame ahead of margin-only work in a full decode queue', async () => {
        const frames = renderFrames(4);
        const mediumImages = frames.map(
            (frame) => frame.querySelector<HTMLImageElement>('[data-progressive-medium]')!
        );
        const started: HTMLImageElement[] = [];
        const releaseActive: Array<() => void> = [];
        vi.mocked(HTMLImageElement.prototype.decode).mockImplementation(function (
            this: HTMLImageElement
        ) {
            if (!mediumImages.includes(this)) return Promise.resolve();
            started.push(this);
            if (started.length > 2) return Promise.resolve();
            return new Promise<void>((resolve) => releaseActive.push(resolve));
        });

        controller.initialize();
        enterMargin(frames);
        await vi.advanceTimersByTimeAsync(3600);
        expect(started).toEqual(mediumImages.slice(0, 2));
        expect(mediumImages.slice(2).every((image) => !image.hasAttribute('src'))).toBe(true);

        // The fourth frame was enqueued last, but is now the only pending visible frame.
        enterViewport([frames[3]!]);
        releaseActive[0]!();
        await vi.advanceTimersByTimeAsync(0);
        expect(started).toEqual([
            mediumImages[0],
            mediumImages[1],
            mediumImages[3],
            mediumImages[2],
        ]);

        releaseActive[1]!();
        await vi.advanceTimersByTimeAsync(0);
    });
});
