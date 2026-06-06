import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { List, X } from 'lucide-react';

interface TocItem {
    id: string;
    text: string;
    level: number;
}

interface ReadingProgressProps {
    contentSelector?: string;
}

function collectHeadings(contentSelector: string): TocItem[] {
    const content = document.querySelector(contentSelector);
    if (!content) return [];

    return Array.from(content.querySelectorAll('h2, h3, h4')).map((heading, index) => {
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

function clamp(value: number): number {
    return Math.min(1, Math.max(0, value));
}

export default function ReadingProgress({
    contentSelector = '.solitude-article-content',
}: ReadingProgressProps) {
    const [headings, setHeadings] = useState<TocItem[]>([]);
    const [activeId, setActiveId] = useState('');
    const [progress, setProgress] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const activeIdRef = useRef('');
    const rafRef = useRef<number | null>(null);

    const hasHeadings = headings.length > 0;

    const updateReadingState = useCallback(() => {
        const content = document.querySelector(contentSelector) as HTMLElement | null;
        const headingElements = Array.from(
            document.querySelectorAll<HTMLElement>(
                `${contentSelector} h2, ${contentSelector} h3, ${contentSelector} h4`
            )
        );

        if (content) {
            const start = content.offsetTop;
            const end = Math.max(start + content.scrollHeight - window.innerHeight, start + 1);
            setProgress(clamp((window.scrollY - start) / (end - start)));
        } else {
            const maxScroll = Math.max(
                document.documentElement.scrollHeight - window.innerHeight,
                1
            );
            setProgress(clamp(window.scrollY / maxScroll));
        }

        let nextActiveId = '';
        const scrollPosition = window.scrollY + 140;
        for (const heading of headingElements) {
            if (heading.offsetTop <= scrollPosition) {
                nextActiveId = heading.id;
            }
        }

        if (nextActiveId && nextActiveId !== activeIdRef.current) {
            activeIdRef.current = nextActiveId;
            setActiveId(nextActiveId);
        }
    }, [contentSelector]);

    useEffect(() => {
        const items = collectHeadings(contentSelector);
        setHeadings(items);

        if (items[0]) {
            setActiveId(items[0].id);
            activeIdRef.current = items[0].id;
        }

        updateReadingState();
    }, [contentSelector, updateReadingState]);

    useEffect(() => {
        const handleScroll = () => {
            if (rafRef.current !== null) return;

            rafRef.current = window.requestAnimationFrame(() => {
                updateReadingState();
                rafRef.current = null;
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);

            if (rafRef.current !== null) {
                window.cancelAnimationFrame(rafRef.current);
            }
        };
    }, [updateReadingState]);

    const tocItems = useMemo(() => headings.filter((heading) => heading.text), [headings]);

    const handleClick = (id: string) => {
        const element = document.getElementById(id);
        if (!element) return;

        window.scrollTo({
            top: Math.max(0, element.offsetTop - 96),
            behavior: 'smooth',
        });
        activeIdRef.current = id;
        setActiveId(id);
        setIsOpen(false);
    };

    return (
        <>
            <div className="reading-progress-bar" aria-hidden="true">
                <span style={{ transform: `scaleX(${progress})` }} />
            </div>

            {hasHeadings && (
                <>
                    <button
                        type="button"
                        className="mobile-toc-trigger"
                        onClick={() => setIsOpen(true)}
                        aria-label="打开目录"
                    >
                        <List className="h-4 w-4" />
                        <span>目录</span>
                    </button>

                    {isOpen && (
                        <div className="mobile-toc-layer" role="presentation">
                            <button
                                type="button"
                                className="mobile-toc-backdrop"
                                onClick={() => setIsOpen(false)}
                                aria-label="关闭目录"
                            />
                            <section
                                className="mobile-toc-sheet"
                                role="dialog"
                                aria-modal="true"
                                aria-label="文章目录"
                            >
                                <header className="mobile-toc-sheet-header">
                                    <span>目录</span>
                                    <button
                                        type="button"
                                        className="mobile-toc-close"
                                        onClick={() => setIsOpen(false)}
                                        aria-label="关闭目录"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </header>
                                <ol className="mobile-toc-list">
                                    {tocItems.map((heading) => (
                                        <li
                                            key={heading.id}
                                            className={`mobile-toc-item mobile-toc-level-${heading.level}`}
                                        >
                                            <button
                                                type="button"
                                                className={
                                                    activeId === heading.id
                                                        ? 'mobile-toc-link is-active'
                                                        : 'mobile-toc-link'
                                                }
                                                onClick={() => handleClick(heading.id)}
                                            >
                                                {heading.text}
                                            </button>
                                        </li>
                                    ))}
                                </ol>
                            </section>
                        </div>
                    )}
                </>
            )}
        </>
    );
}
