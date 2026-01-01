import { useState, useCallback, useEffect, useMemo } from 'react';
import { cn } from '@components/common/lib/utils';
import { HiOutlineMenu, HiOutlineX } from 'react-icons/hi';

// 支持的语言列表
const LOCALES = ['zh', 'ja', 'en'] as const;
type Locale = (typeof LOCALES)[number];
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
 * 构建多语言路径
 */
function buildLocalePath(locale: Locale, path: string = ''): string {
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    return `/${locale}/${normalizedPath}`.replace(/\/+$/, '') || `/${locale}`;
}

interface NavItem {
    path: string; // 相对路径，不含语言前缀
    label: string;
}

const navItemsConfig: NavItem[] = [
    { path: '', label: 'Home' },
    { path: 'post-view', label: 'Posts' },
    { path: 'about', label: 'About Me' },
    { path: 'contact', label: 'Contact' },
    { path: '', label: 'RSS' }, // RSS 暂时为空
    { path: 'privacy-policy', label: 'Privacy Policy' },
];

export default function DockNavMobile() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentLocale, setCurrentLocale] = useState<Locale>(DEFAULT_LOCALE);

    // 客户端初始化当前语言
    useEffect(() => {
        setCurrentLocale(getCurrentLocale());
    }, []);

    // 根据当前语言构建导航链接
    const navItems = useMemo(() => {
        return navItemsConfig.map((item) => ({
            href: item.path === '' && item.label === 'RSS' 
                ? '' // RSS 暂时为空
                : item.path === '' 
                    ? `/${currentLocale}` 
                    : buildLocalePath(currentLocale, item.path),
            label: item.label,
        }));
    }, [currentLocale]);

    const toggleMenu = useCallback(() => {
        setIsOpen((prev) => !prev);
    }, []);

    const closeMenu = useCallback(() => {
        setIsOpen(false);
    }, []);

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
                    'text-color-ui flex h-12 w-12 items-center justify-center rounded-full',
                    'bg-gray-100 opacity-85 shadow-lg transition-all duration-300',
                    'dark:bg-zinc-800',
                    'hover:opacity-100 active:scale-95',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50',
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
                    'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300',
                    isOpen
                        ? 'pointer-events-auto opacity-100'
                        : 'pointer-events-none opacity-0',
                )}
                onClick={closeMenu}
                aria-hidden="true"
            />

            {/* 菜单面板 */}
            <div
                className={cn(
                    'fixed bottom-20 left-4 right-4 z-50',
                    'rounded-2xl bg-gray-100 p-4 shadow-2xl dark:bg-zinc-800',
                    'transform transition-all duration-300 ease-out',
                    isOpen
                        ? 'translate-y-0 scale-100 opacity-100'
                        : 'pointer-events-none translate-y-4 scale-95 opacity-0',
                )}
                role="navigation"
                aria-label="移动端导航菜单"
            >
                <nav className="flex flex-col gap-2">
                    {navItems.map((item) => (
                        <a
                            key={item.label}
                            href={item.href}
                            onClick={closeMenu}
                            className={cn(
                                'text-color-ui block rounded-xl px-4 py-3 font-medium',
                                'transition-colors duration-200',
                                'hover:bg-gray-200 dark:hover:bg-zinc-700',
                                'active:bg-gray-300 dark:active:bg-zinc-600',
                            )}
                        >
                            {item.label}
                        </a>
                    ))}
                </nav>
            </div>
        </div>
    );
}
