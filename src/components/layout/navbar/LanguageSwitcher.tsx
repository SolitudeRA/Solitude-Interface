import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
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

/**
 * 构建切换语言后的 URL
 */
function buildLanguageUrl(targetLocale: Locale): string {
    if (typeof window === 'undefined') return `/${targetLocale}`;
    
    const currentPath = window.location.pathname;
    const pathParts = currentPath.split('/').filter(Boolean);
    
    // 检查第一个路径部分是否是语言代码
    if (pathParts.length > 0 && LOCALES.includes(pathParts[0] as Locale)) {
        // 替换语言代码
        pathParts[0] = targetLocale;
        return '/' + pathParts.join('/');
    }
    
    // 如果没有语言代码，添加到路径前面
    return `/${targetLocale}${currentPath}`;
}

export default function LanguageSwitcher() {
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
            setIsOpen(!isOpen);
        }
    };

    const handleLanguageSelect = (locale: Locale) => {
        if (locale !== currentLocale) {
            window.location.href = buildLanguageUrl(locale);
        }
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* 触发按钮 */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                className={cn(
                    'flex items-center gap-1.5 px-3 py-2',
                    'rounded-lg',
                    'bg-transparent',
                    'text-foreground/80 hover:text-foreground',
                    'hover:bg-muted/50',
                    'transition-all duration-200',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                )}
                aria-label="切换语言"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <Globe className="h-4 w-4" />
                <span className="text-sm font-medium hidden sm:inline">
                    {LOCALE_NAMES[currentLocale]}
                </span>
                <ChevronDown
                    className={cn(
                        'h-3.5 w-3.5 transition-transform duration-200',
                        isOpen && 'rotate-180',
                    )}
                />
            </button>

            {/* 下拉菜单 */}
            {isOpen && (
                <div
                    className={cn(
                        'absolute right-0 top-full mt-2 z-50',
                        'min-w-[140px]',
                        'rounded-xl',
                        'bg-background/95 backdrop-blur-md',
                        'border border-border',
                        'shadow-lg shadow-black/10',
                        'py-1.5',
                        'animate-in fade-in-0 zoom-in-95 duration-150',
                    )}
                    role="listbox"
                    aria-label="选择语言"
                >
                    {LOCALES.map((locale) => {
                        const isSelected = locale === currentLocale;
                        return (
                            <button
                                key={locale}
                                onClick={() => handleLanguageSelect(locale)}
                                className={cn(
                                    'flex w-full items-center gap-2.5 px-3 py-2',
                                    'text-left text-sm',
                                    'transition-colors duration-150',
                                    isSelected
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-foreground/80 hover:bg-muted/50 hover:text-foreground',
                                )}
                                role="option"
                                aria-selected={isSelected}
                            >
                                <span className="text-base leading-none">
                                    {LOCALE_FLAGS[locale]}
                                </span>
                                <span className="flex-1 font-medium">
                                    {LOCALE_NAMES[locale]}
                                </span>
                                {isSelected && (
                                    <Check className="h-4 w-4 text-primary" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
