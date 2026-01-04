import { useEffect, useState, useCallback, useRef } from 'react';

interface TocItem {
    id: string;
    text: string;
    level: number;
}

interface TableOfContentsProps {
    contentSelector?: string;
}

export default function TableOfContents({
    contentSelector = '.solitude-article-content',
}: TableOfContentsProps) {
    const [headings, setHeadings] = useState<TocItem[]>([]);
    const [activeId, setActiveId] = useState<string>('');
    const activeIdRef = useRef<string>('');

    // 提取文章中的标题
    const extractHeadings = useCallback(() => {
        const content = document.querySelector(contentSelector);
        if (!content) return [];

        const headingElements = content.querySelectorAll('h2, h3, h4');
        const items: TocItem[] = [];

        headingElements.forEach((heading, index) => {
            // 如果标题没有 id，为其生成一个
            if (!heading.id) {
                heading.id = `heading-${index}`;
            }

            items.push({
                id: heading.id,
                text: heading.textContent || '',
                level: parseInt(heading.tagName.charAt(1)),
            });
        });

        return items;
    }, [contentSelector]);

    // 初始化
    useEffect(() => {
        const items = extractHeadings();
        setHeadings(items);

        // 设置初始激活项
        if (items.length > 0 && items[0]) {
            setActiveId(items[0].id);
            activeIdRef.current = items[0].id;
        }
    }, [extractHeadings]);

    // 滚动监听
    useEffect(() => {
        const handleScroll = () => {
            const headingElements = document.querySelectorAll(
                `${contentSelector} h2, ${contentSelector} h3, ${contentSelector} h4`,
            );

            let currentActiveId = '';
            const scrollPosition = window.scrollY + 150; // 偏移量

            headingElements.forEach((heading) => {
                const element = heading as HTMLElement;
                if (element.offsetTop <= scrollPosition) {
                    currentActiveId = element.id;
                }
            });

            // 只有当 activeId 真正改变时才更新状态
            if (currentActiveId && currentActiveId !== activeIdRef.current) {
                activeIdRef.current = currentActiveId;
                setActiveId(currentActiveId);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        // 延迟执行初始检查，确保 DOM 已渲染
        const timeoutId = setTimeout(handleScroll, 100);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(timeoutId);
        };
    }, [contentSelector]);

    // 点击跳转
    const handleClick = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const offsetTop = element.offsetTop - 100;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth',
            });
            activeIdRef.current = id;
            setActiveId(id);
        }
    };

    if (headings.length === 0) {
        return null;
    }

    return (
        <nav className="toc-container">
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
                <span>目录</span>
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
                        >
                            {heading.text}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
