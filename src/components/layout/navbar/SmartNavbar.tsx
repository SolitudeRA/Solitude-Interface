import { useEffect, useState, useRef, type ReactNode } from 'react';

interface SmartNavbarProps {
    children: ReactNode;
    isFixed?: boolean;
}

export default function SmartNavbar({ children, isFixed = false }: SmartNavbarProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [isScrolled, setIsScrolled] = useState(false);
    const lastScrollY = useRef(0);
    const ticking = useRef(false);

    useEffect(() => {
        if (!isFixed) return;

        const handleScroll = () => {
            if (!ticking.current) {
                window.requestAnimationFrame(() => {
                    const currentScrollY = window.scrollY;
                    const scrollThreshold = 100;
                    const scrollDelta = 10;

                    // 判断是否已滚动
                    setIsScrolled(currentScrollY > scrollThreshold);

                    // 判断滚动方向
                    if (currentScrollY > lastScrollY.current + scrollDelta) {
                        // 向下滚动超过阈值时隐藏
                        if (currentScrollY > scrollThreshold) {
                            setIsVisible(false);
                        }
                    } else if (currentScrollY < lastScrollY.current - scrollDelta) {
                        // 向上滚动时显示
                        setIsVisible(true);
                    }

                    // 在页面顶部时始终显示
                    if (currentScrollY < scrollThreshold) {
                        setIsVisible(true);
                    }

                    lastScrollY.current = currentScrollY;
                    ticking.current = false;
                });

                ticking.current = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [isFixed]);

    const navClasses = [
        'smart-navbar',
        // 响应式高度：移动端较小，桌面端较大
        'h-[12vh] sm:h-[13vh] md:h-[14vh]',
        'min-h-[60px] sm:min-h-[70px] md:min-h-[80px]',
        'w-full',
        'transition-all',
        'duration-300',
        'ease-in-out',
        'z-50',
        'overflow-visible', // 允许下拉菜单溢出显示
        isFixed ? 'fixed top-0 left-0 right-0' : 'relative',
        isVisible ? 'translate-y-0' : '-translate-y-full',
        isScrolled ? 'smart-navbar-scrolled' : '',
    ].filter(Boolean).join(' ');

    return (
        <nav className={navClasses}>
            <div className="flex h-full w-full items-center justify-between overflow-visible">
                {children}
            </div>
        </nav>
    );
}
