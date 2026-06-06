import { useState, useRef, useEffect } from 'react';
import { cn } from '@components/common/lib/utils';
import {
    DEFAULT_LOCALE,
    getUIText,
    isLocale,
    LOCALE_FLAGS,
    LOCALE_NAMES,
    LOCALES,
    type Locale,
} from '@lib/i18n';

/**
 * 从当前 URL 中提取语言代码
 */
function getCurrentLocale(): Locale {
    if (typeof window === 'undefined') return DEFAULT_LOCALE;

    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const firstPart = pathParts[0];

    if (isLocale(firstPart)) {
        return firstPart;
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
    /** 固定显示文案的语言；未传时跟随当前页面语言 */
    textLocale?: Locale;
}

export default function RssSelector({ className, showLabel = true, textLocale }: RssSelectorProps) {
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
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
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

    // 获取多语言文本
    const displayLocale = textLocale ?? currentLocale;
    const allLanguagesText = getUIText('rss', 'allLanguages', displayLocale);
    const currentText = getUIText('rss', 'current', displayLocale);
    const rssLabel = getUIText('rss', 'label', displayLocale);

    // 生成 RSS 选项列表
    const rssOptions: RssOption[] = [
        {
            id: 'all',
            label: allLanguagesText,
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
                className={cn(
                    'text-xs font-medium whitespace-nowrap md:text-sm lg:text-base',
                    'dock-nav-link'
                )}
                aria-label={rssLabel}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                {showLabel && rssLabel}
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
                        'animate-in fade-in-0 zoom-in-95 duration-150'
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
                                    : 'text-foreground/80 hover:bg-muted/50 hover:text-foreground'
                            )}
                            role="option"
                            aria-selected={option.isCurrent}
                        >
                            <span className="text-base leading-none">{option.flag}</span>
                            <span className="flex-1 font-medium">{option.label}</span>
                            {option.isCurrent && (
                                <span className="text-primary text-xs">{currentText}</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
