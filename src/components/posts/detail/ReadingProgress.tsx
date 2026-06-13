import { useMemo, useState } from 'react';
import { ArrowUp, Link as LinkIcon, List, X } from 'lucide-react';
import { scrollToArticleHeading, useArticleReadingState } from './articleReadingState';

interface ReadingProgressProps {
    contentSelector?: string;
    labels?: {
        title: string;
        open: string;
        close: string;
        dialog: string;
        copyLink: string;
        linkCopied: string;
        backToTop: string;
    };
}

const DEFAULT_LABELS = {
    title: 'Contents',
    open: 'Open contents',
    close: 'Close contents',
    dialog: 'Article contents',
    copyLink: 'Copy link',
    linkCopied: 'Copied link',
    backToTop: 'Back to top',
};

export default function ReadingProgress({
    contentSelector = '.solitude-article-content',
    labels = DEFAULT_LABELS,
}: ReadingProgressProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLinkCopied, setIsLinkCopied] = useState(false);
    const { headings, activeId, progress } = useArticleReadingState(contentSelector);

    const hasHeadings = headings.length > 0;
    const tocItems = useMemo(() => headings.filter((heading) => heading.text), [headings]);

    const handleClick = (id: string) => {
        scrollToArticleHeading(id, contentSelector);
        setIsOpen(false);
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setIsLinkCopied(true);
            window.setTimeout(() => setIsLinkCopied(false), 1600);
        } catch {
            setIsLinkCopied(false);
        }
    };

    const handleBackToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                ? 'auto'
                : 'smooth',
        });
    };

    return (
        <>
            <div className="reading-progress-bar" aria-hidden="true">
                <span style={{ transform: `scaleX(${progress})` }} />
            </div>

            <div className="mobile-reader-actions" aria-label={labels.dialog}>
                {hasHeadings && (
                    <button
                        type="button"
                        className="mobile-reader-action"
                        onClick={() => setIsOpen(true)}
                        aria-label={labels.open}
                        title={labels.open}
                    >
                        <List className="h-4 w-4" />
                    </button>
                )}
                <button
                    type="button"
                    className="mobile-reader-action"
                    onClick={handleCopyLink}
                    aria-label={isLinkCopied ? labels.linkCopied : labels.copyLink}
                    title={isLinkCopied ? labels.linkCopied : labels.copyLink}
                >
                    <LinkIcon className="h-4 w-4" />
                    <span className="sr-only" aria-live="polite">
                        {isLinkCopied ? labels.linkCopied : ''}
                    </span>
                </button>
                <button
                    type="button"
                    className="mobile-reader-action"
                    onClick={handleBackToTop}
                    aria-label={labels.backToTop}
                    title={labels.backToTop}
                >
                    <ArrowUp className="h-4 w-4" />
                </button>
            </div>

            {hasHeadings && isOpen && (
                <div className="mobile-toc-layer" role="presentation">
                    <button
                        type="button"
                        className="mobile-toc-backdrop"
                        onClick={() => setIsOpen(false)}
                        aria-label={labels.close}
                    />
                    <section
                        className="mobile-toc-sheet"
                        role="dialog"
                        aria-modal="true"
                        aria-label={labels.dialog}
                    >
                        <header className="mobile-toc-sheet-header">
                            <span>{labels.title}</span>
                            <button
                                type="button"
                                className="mobile-toc-close"
                                onClick={() => setIsOpen(false)}
                                aria-label={labels.close}
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
                                        aria-current={
                                            activeId === heading.id ? 'location' : undefined
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
    );
}
