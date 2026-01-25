import { useState, useCallback, useEffect, useMemo } from 'react';
import { cn } from '@components/common/lib/utils';
import { HiOutlineMenu, HiOutlineX } from 'react-icons/hi';
import { ChevronDown } from 'lucide-react';

// 支持的语言列表
const LOCALES = ['zh', 'ja', 'en'] as const;
type Locale = (typeof LOCALES)[number];
const DEFAULT_LOCALE: Locale = 'zh';

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

// 多语言文本
const UI_TEXTS = {
    allLanguages: {
        zh: '全部语言',
        ja: 'すべての言語',
        en: 'All Languages',
    },
    current: {
        zh: '当前',
        ja: '現在',
        en: 'Current',
    },
} as const;

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
 * 构建多语言路径
 */
function buildLocalePath(locale: Locale, path: string = ''): string {
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    return `/${locale}/${normalizedPath}`.replace(/\/+$/, '') || `/${locale}`;
}

interface NavItem {
    path: string;
    label: string;
    noLocale?: boolean;
    isRss?: boolean;
}

const navItemsConfig: NavItem[] = [
    { path: '', label: 'Home' },
    { path: 'post-view', label: 'Posts' },
    { path: 'about', label: 'About Me' },
    { path: 'contact', label: 'Contact', noLocale: true },
    { path: '', label: 'RSS', isRss: true },
    { path: 'privacy-policy', label: 'Privacy Policy' },
];

// RSS 订阅选项
interface RssOption {
    id: string;
    label: string;
    href: string;
    flag: string;
}

export default function DockNavMobile() {
    const [isOpen, setIsOpen] = useState(false);
    const [isRssExpanded, setIsRssExpanded] = useState(false);
    const [currentLocale, setCurrentLocale] = useState<Locale>(DEFAULT_LOCALE);

    // 客户端初始化当前语言
    useEffect(() => {
        setCurrentLocale(getCurrentLocale());
    }, []);

    // 获取多语言文本
    const allLanguagesText = UI_TEXTS.allLanguages[currentLocale];
    const currentText = UI_TEXTS.current[currentLocale];

    // RSS 选项列表
    const rssOptions: RssOption[] = useMemo(
        () => [
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
            })),
        ],
        [allLanguagesText]
    );

    // 根据当前语言构建导航链接
    const navItems = useMemo(() => {
        return navItemsConfig.map((item) => ({
            href: item.isRss
                ? ''
                : item.noLocale
                  ? `/${item.path}`
                  : item.path === ''
                    ? `/${currentLocale}`
                    : buildLocalePath(currentLocale, item.path),
            label: item.label,
            isRss: item.isRss,
        }));
    }, [currentLocale]);

    const toggleMenu = useCallback(() => {
        setIsOpen((prev) => !prev);
        // 关闭菜单时重置 RSS 展开状态
        if (isOpen) {
            setIsRssExpanded(false);
        }
    }, [isOpen]);

    const closeMenu = useCallback(() => {
        setIsOpen(false);
        setIsRssExpanded(false);
    }, []);

    const toggleRssMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsRssExpanded((prev) => !prev);
    }, []);

    const handleRssOptionClick = useCallback(
        (href: string) => {
            window.open(href, '_blank', 'noopener,noreferrer');
            closeMenu();
        },
        [closeMenu]
    );

    // 按ESC键关闭菜单
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                closeMenu();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, closeMenu]);

    // 防止滚动穿透
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    return (
        <div className="relative md:hidden">
            {/* 汉堡按钮 */}
            <button
                onClick={toggleMenu}
                className={cn(
                    'dock-button',
                    'text-color-ui flex h-12 w-12 items-center justify-center',
                    isOpen && 'dock-button--active'
                )}
                aria-label={isOpen ? '关闭菜单' : '打开菜单'}
                aria-expanded={isOpen}
            >
                {isOpen ? (
                    <HiOutlineX className="h-6 w-6" />
                ) : (
                    <HiOutlineMenu className="h-6 w-6" />
                )}
            </button>

            {/* 遮罩层 */}
            <div
                className={cn(
                    'dock-overlay fixed inset-0 z-40 transition-opacity duration-300',
                    isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
                )}
                onClick={closeMenu}
                aria-hidden="true"
            />

            {/* 菜单面板 */}
            <div
                className={cn(
                    'dock-menu',
                    'fixed right-4 bottom-20 left-4 z-50 p-4',
                    'transform transition-all duration-300 ease-out',
                    'max-h-[70vh] overflow-y-auto',
                    isOpen
                        ? 'translate-y-0 scale-100 opacity-100'
                        : 'pointer-events-none translate-y-4 scale-95 opacity-0'
                )}
                role="navigation"
                aria-label="移动端导航菜单"
            >
                <nav className="flex flex-col gap-2">
                    {navItems.map((item) =>
                        item.isRss ? (
                            <div key={item.label}>
                                {/* RSS 主按钮 */}
                                <button
                                    onClick={toggleRssMenu}
                                    className={cn(
                                        'dock-menu-item',
                                        'text-color-ui flex w-full items-center justify-between',
                                        isRssExpanded && 'dock-menu-item--active'
                                    )}
                                    aria-expanded={isRssExpanded}
                                    style={
                                        isRssExpanded
                                            ? {
                                                  background: 'var(--dock-menu-item-hover-bg)',
                                              }
                                            : undefined
                                    }
                                >
                                    <span>{item.label}</span>
                                    <ChevronDown
                                        className={cn(
                                            'h-4 w-4 transition-transform duration-200',
                                            isRssExpanded && 'rotate-180'
                                        )}
                                    />
                                </button>

                                {/* RSS 子菜单 */}
                                <div
                                    className={cn(
                                        'overflow-hidden transition-all duration-200',
                                        isRssExpanded ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
                                    )}
                                >
                                    <div className="mt-1 ml-4 flex flex-col gap-1">
                                        {rssOptions.map((option) => (
                                            <button
                                                key={option.id}
                                                onClick={() => handleRssOptionClick(option.href)}
                                                className={cn(
                                                    'dock-menu-subitem',
                                                    'text-color-ui flex items-center gap-2',
                                                    option.id === currentLocale
                                                        ? 'bg-primary/10 text-primary'
                                                        : ''
                                                )}
                                            >
                                                <span className="text-base">{option.flag}</span>
                                                <span>{option.label}</span>
                                                {option.id === currentLocale && (
                                                    <span className="text-primary ml-auto text-xs">
                                                        {currentText}
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <a
                                key={item.label}
                                href={item.href}
                                onClick={closeMenu}
                                className={cn('dock-menu-item', 'text-color-ui block')}
                            >
                                {item.label}
                            </a>
                        )
                    )}
                </nav>
            </div>
        </div>
    );
}
