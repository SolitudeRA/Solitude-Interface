import { useState, useRef, useEffect } from 'react';
import { cn } from '@components/common/lib/utils';

// 支持的语言列表
const LOCALES = ['zh', 'ja', 'en'] as const;
type Locale = (typeof LOCALES)[number];

// 语言名称映射
const LOCALE_NAMES: Record<Locale, string> = {
    zh: '中文',
    ja: '日本語',
    en: 'English',
};

// 语言标志（使用 emoji）
const LOCALE_FLAGS: Record<Locale, string> = {
    zh: '🇨🇳',
    ja: '🇯🇵',
    en: '🇺🇸',
};

// 默认语言
const DEFAULT_LOCALE: Locale = 'zh';

/**
 * 从当前 URL 中提取语言代码
 */
function getCurrentLocale(): Locale {
    if (typeof window === 'undefined') return DEFAULT_LOCALE;

    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const firstPart = pathParts[0];

    if (firstPart && LOCALES.includes(firstPart as Locale)) {
        return firstPart as Locale;
    }

    return DEFAULT_LOCALE;
}

interface RssOption {
    id: string;
    label: string;
    href: string;
    flag: string;
    isCurrent?: boolean;
}

interface RssSelectorProps {
    /** 自定义样式类名 */
    className?: string;
    /** 是否显示文字标签 */
    showLabel?: boolean;
}

export default function RssSelector({
    className,
    showLabel = true,
}: RssSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentLocale, setCurrentLocale] = useState<Locale>(DEFAULT_LOCALE);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 客户端初始化当前语言
    useEffect(() => {
        setCurrentLocale(getCurrentLocale());
    }, []);

    // 点击外部关闭下拉菜单
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 键盘导航支持
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
        }
    };

    // 生成 RSS 选项列表
    const rssOptions: RssOption[] = [
        {
            id: 'all',
            label: '全部语言',
            href: '/rss.xml',
            flag: '📡',
        },
        ...LOCALES.map((locale) => ({
            id: locale,
            label: LOCALE_NAMES[locale],
            href: `/${locale}/rss.xml`,
            flag: LOCALE_FLAGS[locale],
            isCurrent: locale === currentLocale,
        })),
    ];

    const handleOptionClick = (href: string) => {
        // 在新标签页打开 RSS 链接
        window.open(href, '_blank', 'noopener,noreferrer');
        setIsOpen(false);
    };

    return (
        <div className={cn('relative', className)} ref={dropdownRef}>
            {/* 触发按钮 - 保持与其他导航元素一致的样式 */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                className="text-xs font-medium whitespace-nowrap md:text-sm lg:text-base"
                aria-label="订阅 RSS"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                {showLabel && 'RSS'}
            </button>

            {/* 下拉菜单 - 往上出现 */}
            {isOpen && (
                <div
                    className={cn(
                        'absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2',
                        'min-w-[160px]',
                        'rounded-xl',
                        'bg-background/95 backdrop-blur-md',
                        'border-border border',
                        'shadow-lg shadow-black/10',
                        'py-1.5',
                        'animate-in fade-in-0 zoom-in-95 duration-150',
                    )}
                    role="listbox"
                    aria-label="选择 RSS 订阅源"
                >
                    {rssOptions.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => handleOptionClick(option.href)}
                            className={cn(
                                'flex w-full items-center gap-2.5 px-3 py-2',
                                'text-left text-sm',
                                'transition-colors duration-150',
                                option.isCurrent
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-foreground/80 hover:bg-muted/50 hover:text-foreground',
                            )}
                            role="option"
                            aria-selected={option.isCurrent}
                        >
                            <span className="text-base leading-none">
                                {option.flag}
                            </span>
                            <span className="flex-1 font-medium">
                                {option.label}
                            </span>
                            {option.isCurrent && (
                                <span className="text-primary text-xs">
                                    当前
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
