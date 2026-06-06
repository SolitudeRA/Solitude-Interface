import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { cn } from '@components/common/lib/utils';
import { useAtomValue } from 'jotai';
import { themeSwitchAtom } from '@stores/themeAtom';
import {
    DEFAULT_LOCALE,
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

/**
 * 构建切换语言后的 URL
 */
function buildLanguageUrl(targetLocale: Locale): string {
    if (typeof window === 'undefined') return `/${targetLocale}`;

    const currentPath = window.location.pathname;
    const pathParts = currentPath.split('/').filter(Boolean);

    // 检查第一个路径部分是否是语言代码
    if (pathParts.length > 0 && isLocale(pathParts[0])) {
        // 替换语言代码
        pathParts[0] = targetLocale;
        return '/' + pathParts.join('/');
    }

    // 如果没有语言代码，添加到路径前面
    return `/${targetLocale}${currentPath}`;
}

interface LanguageSwitcherProps {
    availableLocales?: readonly Locale[] | undefined;
    displayLocale?: Locale | undefined;
}

export default function LanguageSwitcher({
    availableLocales,
    displayLocale,
}: LanguageSwitcherProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentLocale, setCurrentLocale] = useState<Locale>(displayLocale ?? DEFAULT_LOCALE);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const theme = useAtomValue(themeSwitchAtom);
    const isLightMode = theme === 'light';
    const visibleLocales =
        availableLocales?.length && availableLocales.every(isLocale) ? availableLocales : LOCALES;
    const activeLocale = displayLocale ?? currentLocale;
    const buttonLocale = visibleLocales.includes(activeLocale)
        ? activeLocale
        : (visibleLocales[0] ?? DEFAULT_LOCALE);
    const canSwitchLocale = visibleLocales.length > 1;

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
        } else if (canSwitchLocale && (e.key === 'Enter' || e.key === ' ')) {
            setIsOpen(!isOpen);
        }
    };

    const handleLanguageSelect = (locale: Locale) => {
        if (locale !== activeLocale) {
            window.location.href = buildLanguageUrl(locale);
        }
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* 触发按钮 */}
            <button
                type="button"
                onClick={() => setIsOpen((open) => (canSwitchLocale ? !open : false))}
                onKeyDown={handleKeyDown}
                className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5',
                    'rounded-full',
                    'border transition-all duration-300',
                    'shadow-md hover:shadow-lg',
                    'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                    // 主题适配样式
                    isLightMode
                        ? 'hover:bg-amber-150 border-amber-300 bg-amber-100 text-amber-800'
                        : 'border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800'
                )}
                aria-label="切换语言"
                aria-expanded={canSwitchLocale ? isOpen : false}
                aria-haspopup={canSwitchLocale ? 'listbox' : undefined}
            >
                <Globe className="h-4 w-4" strokeWidth={2.5} />
                <span className="hidden text-sm font-medium sm:inline">
                    {LOCALE_NAMES[buttonLocale]}
                </span>
                {canSwitchLocale && (
                    <ChevronDown
                        className={cn(
                            'h-3.5 w-3.5 transition-transform duration-200',
                            isOpen && 'rotate-180'
                        )}
                        strokeWidth={2.5}
                    />
                )}
            </button>

            {/* 下拉菜单 */}
            {isOpen && canSwitchLocale && (
                <div
                    className={cn(
                        'absolute top-full right-0 z-50 mt-2',
                        'min-w-[140px]',
                        'rounded-2xl',
                        'border backdrop-blur-md',
                        'shadow-lg',
                        'py-1.5',
                        'animate-in fade-in-0 zoom-in-95 duration-150',
                        // 主题适配样式
                        isLightMode
                            ? 'border-amber-200 bg-amber-50/95 shadow-amber-200/30'
                            : 'border-neutral-700 bg-neutral-900/95 shadow-black/30'
                    )}
                    role="listbox"
                    aria-label="选择语言"
                >
                    {visibleLocales.map((locale) => {
                        const isSelected = locale === activeLocale;
                        return (
                            <button
                                key={locale}
                                type="button"
                                onClick={() => handleLanguageSelect(locale)}
                                className={cn(
                                    'flex w-full items-center gap-2.5 px-3 py-2',
                                    'text-left text-sm',
                                    'transition-colors duration-150',
                                    // 主题适配样式
                                    isSelected
                                        ? isLightMode
                                            ? 'bg-amber-200/50 text-amber-900'
                                            : 'bg-neutral-700/50 text-neutral-100'
                                        : isLightMode
                                          ? 'text-amber-800 hover:bg-amber-100/50'
                                          : 'text-neutral-300 hover:bg-neutral-800/50'
                                )}
                                role="option"
                                aria-selected={isSelected}
                            >
                                <span className="text-base leading-none">
                                    {LOCALE_FLAGS[locale]}
                                </span>
                                <span className="flex-1 font-medium">{LOCALE_NAMES[locale]}</span>
                                {isSelected && (
                                    <Check
                                        className={cn(
                                            'h-4 w-4',
                                            isLightMode ? 'text-amber-700' : 'text-neutral-300'
                                        )}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
