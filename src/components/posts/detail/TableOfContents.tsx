import { scrollToArticleHeading, useArticleReadingState } from './articleReadingState';

interface TableOfContentsProps {
    contentSelector?: string;
    labels?: {
        title: string;
    };
}

const DEFAULT_LABELS = {
    title: 'Contents',
};

export default function TableOfContents({
    contentSelector = '.solitude-article-content',
    labels = DEFAULT_LABELS,
}: TableOfContentsProps) {
    const { headings, activeId } = useArticleReadingState(contentSelector);

    const handleClick = (id: string) => {
        scrollToArticleHeading(id, contentSelector);
    };

    if (headings.length === 0) {
        return null;
    }

    return (
        <nav className="toc-container" aria-label={labels.title}>
            <div className="toc-header">
                <svg
                    className="toc-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M4 6h16M4 12h16M4 18h12" />
                </svg>
                <span>{labels.title}</span>
                <span className="toc-count">{headings.length}</span>
            </div>
            <ul className="toc-list">
                {headings.map((heading) => (
                    <li
                        key={heading.id}
                        className={`toc-item toc-level-${heading.level} ${
                            activeId === heading.id ? 'toc-active' : ''
                        }`}
                    >
                        <button
                            onClick={() => handleClick(heading.id)}
                            className="toc-link"
                            aria-current={activeId === heading.id ? 'true' : undefined}
                            title={heading.text}
                            type="button"
                        >
                            {heading.text}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
