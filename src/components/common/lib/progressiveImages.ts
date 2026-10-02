export interface ProgressiveImageController {
    initialize: () => void;
    dispose: () => void;
}

export const createProgressiveImageController = (): ProgressiveImageController => {
    let observer: IntersectionObserver | null = null;
    let visibleObserver: IntersectionObserver | null = null;
    const visibility = new WeakMap<
        HTMLElement,
        {
            current: boolean;
            seen: boolean;
            ready: Promise<void>;
            promote: () => void;
        }
    >();
    const getVisibility = (frame: HTMLElement) => {
        const existing = visibility.get(frame);
        if (existing) return existing;
        let promote: () => void = () => undefined;
        const ready = new Promise<void>((resolve) => {
            promote = resolve;
        });
        const state = { current: false, seen: false, ready, promote };
        visibility.set(frame, state);
        return state;
    };
    const markVisible = (frame: HTMLElement, current: boolean) => {
        const state = getVisibility(frame);
        state.current = current;
        if (current && !state.seen) {
            state.seen = true;
            state.promote();
        }
    };
    let lastInteractionAt = performance.now();
    let hasUserInteracted = false;
    let resolveFirstInteraction: () => void = () => undefined;
    const firstInteraction = new Promise<void>((resolve) => {
        resolveFirstInteraction = resolve;
    });

    const trackActivity = () => {
        lastInteractionAt = performance.now();
    };

    const trackUserInteraction = () => {
        trackActivity();
        if (hasUserInteracted) return;
        hasUserInteracted = true;
        resolveFirstInteraction();
    };

    document.addEventListener('scroll', trackActivity, { capture: true, passive: true });
    ['wheel', 'pointerdown', 'keydown', 'touchstart'].forEach((eventName) => {
        document.addEventListener(eventName, trackUserInteraction, {
            capture: true,
            passive: true,
        });
    });

    interface TaskQueue {
        enqueue: <T>(task: () => Promise<T>, isForeground?: () => boolean) => Promise<T>;
    }

    const createTaskQueue = (concurrency: number): TaskQueue => {
        let active = 0;
        const pending: Array<{
            task: () => Promise<unknown>;
            isForeground: () => boolean;
            resolve: (value: unknown) => void;
            reject: (reason?: unknown) => void;
        }> = [];

        const pump = () => {
            while (active < concurrency && pending.length > 0) {
                const foregroundIndex = pending.findIndex((item) => item.isForeground());
                const [item] = pending.splice(Math.max(0, foregroundIndex), 1);
                if (!item) return;
                active += 1;
                void item
                    .task()
                    .then(item.resolve, item.reject)
                    .finally(() => {
                        active -= 1;
                        pump();
                    });
            }
        };

        return {
            enqueue: <T>(task: () => Promise<T>, isForeground = () => false) =>
                new Promise<T>((resolve, reject) => {
                    pending.push({
                        task,
                        isForeground,
                        resolve: resolve as (value: unknown) => void,
                        reject,
                    });
                    pump();
                }),
        };
    };

    const lowQueue = createTaskQueue(2);
    const mediumQueue = createTaskQueue(2);
    const highQueue = createTaskQueue(1);

    const waitForIdle = (timeout: number) =>
        new Promise<void>((resolve) => {
            if ('requestIdleCallback' in window) {
                window.requestIdleCallback(() => resolve(), { timeout });
            } else {
                globalThis.setTimeout(resolve, 32);
            }
        });

    const waitForInteractionIdle = async (quietWindow = 320) => {
        while (true) {
            const remaining = lastInteractionAt + quietWindow - performance.now();
            if (remaining <= 0) return;
            await new Promise<void>((resolve) => window.setTimeout(resolve, remaining));
        }
    };

    const waitForFirstInteractionOrTimeout = async (timeout: number) => {
        if (hasUserInteracted) return;
        await Promise.race([
            firstInteraction,
            new Promise<void>((resolve) => window.setTimeout(resolve, timeout)),
        ]);
    };

    const decodeImage = async (image: HTMLImageElement): Promise<boolean> => {
        try {
            await image.decode();
            return image.naturalWidth > 0;
        } catch {
            return image.complete && image.naturalWidth > 0;
        }
    };

    const activateDeferredImage = async (image: HTMLImageElement): Promise<boolean> => {
        const deferredSizes = image.dataset.progressiveSizes;
        const deferredSrcset = image.dataset.progressiveSrcset;
        const deferredSrc = image.dataset.progressiveSrc;

        // Programmatic activation is the single visibility gate. Keeping native lazy loading
        // here can defer an already-approved stage again, especially for fixed backgrounds.
        image.loading = 'eager';
        if (deferredSizes) image.sizes = deferredSizes;
        if (deferredSrcset) image.srcset = deferredSrcset;
        if (deferredSrc) image.src = deferredSrc;

        return decodeImage(image);
    };

    interface ProgressiveGates {
        medium: Promise<void>;
        high: Promise<void>;
    }

    interface CriticalBatch extends ProgressiveGates {
        markMedium: () => void;
        markHigh: () => void;
    }

    const createCriticalBatch = (count: number): CriticalBatch => {
        if (count === 0) {
            return {
                medium: Promise.resolve(),
                high: Promise.resolve(),
                markMedium: () => undefined,
                markHigh: () => undefined,
            };
        }

        let mediumRemaining = count;
        let highRemaining = count;
        let resolveMedium: () => void = () => undefined;
        let resolveHigh: () => void = () => undefined;
        const medium = new Promise<void>((resolve) => {
            resolveMedium = resolve;
        });
        const high = new Promise<void>((resolve) => {
            resolveHigh = resolve;
        });

        return {
            medium,
            high,
            markMedium: () => {
                mediumRemaining -= 1;
                if (mediumRemaining === 0) resolveMedium();
            },
            markHigh: () => {
                highRemaining -= 1;
                if (highRemaining === 0) resolveHigh();
            },
        };
    };

    const getStages = (frame: HTMLElement) => ({
        low: frame.querySelector<HTMLImageElement>('[data-progressive-low]'),
        medium: frame.querySelector<HTMLImageElement>('[data-progressive-medium]'),
        high: frame.querySelector<HTMLImageElement>('[data-progressive-high]'),
    });

    const finishHighStage = (frame: HTMLElement) => {
        frame.dataset.progressivePhase = 'high';
        frame.dataset.progressiveReady = 'true';
        frame.setAttribute('aria-busy', 'false');

        // Once the sharp layer is fully opaque, remove the superseded textures from the
        // render tree. Long horizontal galleries otherwise retain three composited images
        // per visited card even though only the high stage remains visible.
        window.setTimeout(() => {
            if (!frame.isConnected || frame.dataset.progressivePhase !== 'high') return;
            const { low, medium } = getStages(frame);
            if (low) low.hidden = true;
            if (medium) medium.hidden = true;
        }, 200);
    };

    const startCritical = async (frame: HTMLElement, batch: CriticalBatch) => {
        if (frame.dataset.progressiveStarted === 'true') return;
        frame.dataset.progressiveStarted = 'true';
        observer?.unobserve(frame);

        const { low, medium, high } = getStages(frame);
        if (!low || !medium || !high) {
            batch.markMedium();
            batch.markHigh();
            return;
        }

        low.loading = 'eager';
        await decodeImage(low);
        if (!frame.isConnected) {
            batch.markMedium();
            batch.markHigh();
            return;
        }

        const mediumReady = await activateDeferredImage(medium);
        if (mediumReady) frame.dataset.progressivePhase = 'medium';
        batch.markMedium();
        if (!frame.isConnected) {
            batch.markHigh();
            return;
        }

        await waitForFirstInteractionOrTimeout(6000);
        await waitForInteractionIdle(600);
        await waitForIdle(1500);
        await waitForInteractionIdle(300);
        if (!frame.isConnected) {
            batch.markHigh();
            return;
        }
        const highReady = await highQueue.enqueue(() =>
            frame.isConnected ? activateDeferredImage(high) : Promise.resolve(false)
        );
        await waitForInteractionIdle();
        if (frame.isConnected && highReady) finishHighStage(frame);
        batch.markHigh();
    };

    const startStandard = async (frame: HTMLElement, gates: ProgressiveGates) => {
        if (frame.dataset.progressiveStarted === 'true') return;
        frame.dataset.progressiveStarted = 'true';
        observer?.unobserve(frame);

        const { low, medium, high } = getStages(frame);
        if (!low || !medium || !high) return;

        const isPriority = frame.dataset.progressivePriority === 'true';
        const state = getVisibility(frame);
        const isForeground = () => isPriority || state.current;
        const waitUnlessSeen = (backgroundWait: () => Promise<void>) =>
            isPriority || state.seen
                ? Promise.resolve()
                : Promise.race([backgroundWait(), state.ready]);
        const hasDeferredLow = Boolean(low.dataset.progressiveSrc);
        if (hasDeferredLow) {
            low.loading = 'eager';
            const lowReady = await lowQueue.enqueue(() =>
                frame.isConnected ? activateDeferredImage(low) : Promise.resolve(false)
            );
            if (frame.isConnected && lowReady) frame.dataset.progressivePhase = 'low';
        } else if (!hasDeferredLow) {
            await decodeImage(low);
        }
        if (!frame.isConnected) return;

        // The true viewport observer promotes every visible card, including cards that were
        // already warming in the margin observer. Decorative/background gates only apply to
        // frames the user has not seen; a wide first screen must not wait 3.2/6 seconds.
        await waitUnlessSeen(async () => {
            await gates.medium;
            await waitForFirstInteractionOrTimeout(3200);
            await waitForInteractionIdle(420);
        });
        if (!frame.isConnected) return;

        if (!isPriority && !state.seen) await waitForInteractionIdle();
        const mediumReady = await mediumQueue.enqueue(
            () => (frame.isConnected ? activateDeferredImage(medium) : Promise.resolve(false)),
            isForeground
        );
        if (!frame.isConnected) return;
        if (!isPriority && !state.seen) await waitForInteractionIdle();
        if (frame.isConnected && mediumReady) frame.dataset.progressivePhase = 'medium';

        await waitUnlessSeen(() => gates.high);
        if (!frame.isConnected) return;

        await waitForIdle(isPriority || state.seen ? 650 : 1200);
        await waitForInteractionIdle();
        if (!frame.isConnected) return;

        const highReady = await highQueue.enqueue(async () => {
            if (!frame.isConnected) return false;
            await waitForInteractionIdle();
            return frame.isConnected ? activateDeferredImage(high) : false;
        }, isForeground);
        if (!frame.isConnected) return;
        await waitForInteractionIdle();
        if (frame.isConnected && highReady) {
            finishHighStage(frame);
        }
    };

    const initialize = () => {
        observer?.disconnect();
        visibleObserver?.disconnect();
        const frames = Array.from(
            document.querySelectorAll<HTMLElement>(
                '[data-progressive-image]:not([data-progressive-started="true"])'
            )
        );
        const criticalFrames = frames.filter(
            (frame) => frame.dataset.progressiveCritical === 'true'
        );
        const standardFrames = frames.filter(
            (frame) => frame.dataset.progressiveCritical !== 'true'
        );
        const criticalBatch = createCriticalBatch(criticalFrames.length);

        const frameForTarget = (target: Element) =>
            target.matches('[data-progressive-image]')
                ? (target as HTMLElement)
                : target.querySelector<HTMLElement>('[data-progressive-image]');
        visibleObserver =
            'IntersectionObserver' in window
                ? new IntersectionObserver(
                      (entries) => {
                          entries.forEach((entry) => {
                              const frame = frameForTarget(entry.target);
                              if (!frame) return;
                              markVisible(frame, entry.isIntersecting);
                              if (entry.isIntersecting) void startStandard(frame, criticalBatch);
                          });
                      },
                      { rootMargin: '0px' }
                  )
                : null;

        observer =
            'IntersectionObserver' in window
                ? new IntersectionObserver(
                      (entries) => {
                          entries.forEach((entry) => {
                              if (entry.isIntersecting) {
                                  observer?.unobserve(entry.target);
                                  const target = entry.target as HTMLElement;
                                  const frame = target.matches('[data-progressive-image]')
                                      ? target
                                      : target.querySelector<HTMLElement>(
                                            '[data-progressive-image]:not([data-progressive-started="true"])'
                                        );
                                  if (frame) {
                                      void startStandard(frame, criticalBatch);
                                  }
                              }
                          });
                      },
                      { rootMargin: '360px' }
                  )
                : null;

        criticalFrames.forEach((frame) => void startCritical(frame, criticalBatch));
        // Re-initialization also re-observes queued frames; the page-load lifecycle can run
        // twice, and a frame waiting on the margin must still be promotable on entry.
        document
            .querySelectorAll<HTMLElement>(
                '[data-progressive-image]:not([data-progressive-critical="true"]):not([data-progressive-phase="high"])'
            )
            .forEach((frame) => {
                visibleObserver?.observe(
                    frame.closest('[data-progressive-observer-boundary]') ?? frame
                );
            });
        standardFrames.forEach((frame) => {
            if (frame.dataset.progressivePriority === 'true' || !observer) {
                void startStandard(frame, criticalBatch);
            } else {
                observer.observe(
                    frame.closest<HTMLElement>('[data-progressive-observer-boundary]') ?? frame
                );
            }
        });
    };

    return {
        initialize,
        dispose: () => {
            observer?.disconnect();
            visibleObserver?.disconnect();
            document.removeEventListener('scroll', trackActivity, true);
            ['wheel', 'pointerdown', 'keydown', 'touchstart'].forEach((eventName) => {
                document.removeEventListener(eventName, trackUserInteraction, true);
            });
        },
    };
};
