import { useEffect, useState } from 'react';

export interface TocItem {
    id: string;
    text: string;
    level: number;
}

export interface ArticleReadingSnapshot {
    headings: TocItem[];
    activeId: string;
    progress: number;
}

const INITIAL_SNAPSHOT: ArticleReadingSnapshot = {
    headings: [],
    activeId: '',
    progress: 0,
};

type Subscriber = () => void;

function clamp(value: number): number {
    return Math.min(1, Math.max(0, value));
}

function getHeadingElements(contentSelector: string): HTMLElement[] {
    const content = document.querySelector(contentSelector);
    if (!content) return [];

    return Array.from(content.querySelectorAll<HTMLElement>('h2, h3, h4'));
}

function ensureHeadingIds(headings: HTMLElement[]): TocItem[] {
    return headings.map((heading, index) => {
        if (!heading.id) {
            heading.id = `heading-${index}`;
        }

        return {
            id: heading.id,
            text: heading.textContent?.trim() || '',
            level: Number.parseInt(heading.tagName.charAt(1), 10),
        };
    });
}

class ArticleReadingStore {
    private snapshot = INITIAL_SNAPSHOT;
    private subscribers = new Set<Subscriber>();
    private frame: number | null = null;
    private observer: IntersectionObserver | null = null;
    private mutationObserver: MutationObserver | null = null;
    private resizeObserver: ResizeObserver | null = null;
    private headingElements: HTMLElement[] = [];
    private started = false;
    private lastHashId = '';

    constructor(private readonly contentSelector: string) {}

    getSnapshot = () => this.snapshot;

    subscribe = (subscriber: Subscriber) => {
        this.subscribers.add(subscriber);

        if (!this.started) {
            this.start();
        }

        subscriber();

        return () => {
            this.subscribers.delete(subscriber);

            if (this.subscribers.size === 0) {
                this.stop();
            }
        };
    };

    scrollToHeading = (id: string) => {
        const element = document.getElementById(id);
        if (!element) return;

        element.scrollIntoView({
            block: 'start',
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                ? 'auto'
                : 'smooth',
        });

        this.setActiveId(id, true);
    };

    private start() {
        this.started = true;
        this.rebuild();

        window.addEventListener('scroll', this.scheduleUpdate, { passive: true });
        window.addEventListener('resize', this.scheduleRebuild);
        window.addEventListener('orientationchange', this.scheduleRebuild, { passive: true });
        document.addEventListener('astro:after-swap', this.scheduleRebuild);
        document.fonts?.ready.then(this.scheduleRebuild).catch(() => undefined);
    }

    private stop() {
        this.started = false;

        window.removeEventListener('scroll', this.scheduleUpdate);
        window.removeEventListener('resize', this.scheduleRebuild);
        window.removeEventListener('orientationchange', this.scheduleRebuild);
        document.removeEventListener('astro:after-swap', this.scheduleRebuild);

        this.observer?.disconnect();
        this.observer = null;
        this.mutationObserver?.disconnect();
        this.mutationObserver = null;
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;

        if (this.frame !== null) {
            window.cancelAnimationFrame(this.frame);
            this.frame = null;
        }
    }

    private scheduleRebuild = () => {
        if (!this.started || this.frame !== null) return;

        this.frame = window.requestAnimationFrame(() => {
            this.frame = null;
            this.rebuild();
        });
    };

    private scheduleUpdate = () => {
        if (!this.started || this.frame !== null) return;

        this.frame = window.requestAnimationFrame(() => {
            this.frame = null;
            this.updateReadingState();
        });
    };

    private rebuild = () => {
        const content = document.querySelector<HTMLElement>(this.contentSelector);
        this.headingElements = getHeadingElements(this.contentSelector);
        const headings = ensureHeadingIds(this.headingElements).filter((heading) => heading.text);

        this.snapshot = {
            headings,
            activeId:
                headings.find((heading) => heading.id === this.snapshot.activeId)?.id ??
                headings[0]?.id ??
                '',
            progress: this.snapshot.progress,
        };

        this.setupObservers(content);
        this.updateReadingState();
        this.emit();
    };

    private setupObservers(content: HTMLElement | null) {
        this.observer?.disconnect();
        this.observer = null;

        if ('IntersectionObserver' in window && this.headingElements.length > 0) {
            this.observer = new IntersectionObserver(this.scheduleUpdate, {
                root: null,
                rootMargin: '-96px 0px -70% 0px',
                threshold: [0, 0.5, 1],
            });
            this.headingElements.forEach((heading) => this.observer?.observe(heading));
        }

        this.mutationObserver?.disconnect();
        this.mutationObserver = null;

        if (content && 'MutationObserver' in window) {
            this.mutationObserver = new MutationObserver(this.scheduleRebuild);
            this.mutationObserver.observe(content, {
                childList: true,
                subtree: true,
                characterData: true,
            });
        }

        this.resizeObserver?.disconnect();
        this.resizeObserver = null;

        if (content && 'ResizeObserver' in window) {
            this.resizeObserver = new ResizeObserver(this.scheduleUpdate);
            this.resizeObserver.observe(content);
        }
    }

    private updateReadingState = () => {
        const content = document.querySelector<HTMLElement>(this.contentSelector);
        const progress = this.calculateProgress(content);
        const activeId = this.findActiveHeadingId(content);

        const nextSnapshot = {
            ...this.snapshot,
            activeId: activeId || this.snapshot.activeId,
            progress,
        };

        const didChange =
            nextSnapshot.activeId !== this.snapshot.activeId ||
            nextSnapshot.progress !== this.snapshot.progress;

        this.snapshot = nextSnapshot;

        if (activeId) {
            this.updateUrlHash(activeId, content);
        }

        if (didChange) {
            this.emit();
        }
    };

    private calculateProgress(content: HTMLElement | null): number {
        if (!content) {
            const maxScroll = Math.max(
                document.documentElement.scrollHeight - window.innerHeight,
                1
            );
            return clamp(window.scrollY / maxScroll);
        }

        const start = content.offsetTop;
        const end = Math.max(start + content.scrollHeight - window.innerHeight, start + 1);

        return clamp((window.scrollY - start) / (end - start));
    }

    private findActiveHeadingId(content: HTMLElement | null): string {
        if (this.headingElements.length === 0) return '';

        const scrollPosition = window.scrollY + 140;
        let activeId = this.headingElements[0]?.id ?? '';

        for (const heading of this.headingElements) {
            if (heading.offsetTop <= scrollPosition) {
                activeId = heading.id;
            }
        }

        if (content && window.scrollY < content.offsetTop - 140) {
            return this.headingElements[0]?.id ?? '';
        }

        return activeId;
    }

    private setActiveId(id: string, shouldUpdateHash = false) {
        if (id === this.snapshot.activeId) {
            if (shouldUpdateHash) this.updateUrlHash(id);
            return;
        }

        this.snapshot = {
            ...this.snapshot,
            activeId: id,
        };

        if (shouldUpdateHash) {
            this.updateUrlHash(id);
        }

        this.emit();
    }

    private updateUrlHash(id: string, content?: HTMLElement | null) {
        if (!id || id === this.lastHashId) return;

        const contentTop =
            content?.offsetTop ??
            document.querySelector<HTMLElement>(this.contentSelector)?.offsetTop ??
            0;

        if (window.scrollY < contentTop - 80) return;

        const url = new URL(window.location.href);
        url.hash = id;

        if (url.href !== window.location.href) {
            window.history.replaceState(window.history.state, '', url);
        }

        this.lastHashId = id;
    }

    private emit() {
        this.subscribers.forEach((subscriber) => subscriber());
    }
}

const stores = new Map<string, ArticleReadingStore>();

function getStore(contentSelector: string): ArticleReadingStore {
    const existing = stores.get(contentSelector);
    if (existing) return existing;

    const store = new ArticleReadingStore(contentSelector);
    stores.set(contentSelector, store);

    return store;
}

export function useArticleReadingState(
    contentSelector = '.solitude-article-content'
): ArticleReadingSnapshot {
    const [snapshot, setSnapshot] = useState<ArticleReadingSnapshot>(INITIAL_SNAPSHOT);

    useEffect(() => {
        const store = getStore(contentSelector);

        return store.subscribe(() => {
            setSnapshot(store.getSnapshot());
        });
    }, [contentSelector]);

    return snapshot;
}

export function scrollToArticleHeading(
    id: string,
    contentSelector = '.solitude-article-content'
): void {
    getStore(contentSelector).scrollToHeading(id);
}
