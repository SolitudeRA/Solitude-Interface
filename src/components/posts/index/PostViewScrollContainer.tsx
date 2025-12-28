import * as React from 'react';
import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@components/common/lib/utils';

interface PostViewScrollContainerProps {
    children: React.ReactNode;
    className?: string;
}

export default function PostViewScrollContainer({
    children,
    className,
}: PostViewScrollContainerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [isHovering, setIsHovering] = useState(false);

    // 更新滚动状态
    const updateScrollState = useCallback(() => {
        if (!containerRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
        setCanScrollLeft(scrollLeft > 1);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }, []);

    // 监听滚动和容器变化
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        updateScrollState();
        container.addEventListener('scroll', updateScrollState, {
            passive: true,
        });

        const resizeObserver = new ResizeObserver(updateScrollState);
        resizeObserver.observe(container);

        return () => {
            container.removeEventListener('scroll', updateScrollState);
            resizeObserver.disconnect();
        };
    }, [updateScrollState]);

    // 鼠标滚轮横向滚动
    const handleWheel = useCallback(
        (e: React.WheelEvent<HTMLDivElement>) => {
            if (!containerRef.current || !isHovering) return;

            const container = containerRef.current;
            const { scrollWidth, clientWidth, scrollLeft } = container;
            const canScroll = scrollWidth > clientWidth;

            // 判断是否在边界
            const atStart = scrollLeft <= 0 && e.deltaY < 0;
            const atEnd =
                scrollLeft >= scrollWidth - clientWidth && e.deltaY > 0;

            // 仅在可横向滚动且不在边界时拦截
            if (canScroll && !atStart && !atEnd) {
                e.preventDefault();
                e.stopPropagation();

                // 计算单个卡片的滚动距离
                const card = container.querySelector('.post-card-wrapper');
                const cardWidth = card?.getBoundingClientRect().width || 300;
                const gap = 60; // gap-[60px]
                const scrollDistance = cardWidth + gap;

                const direction = e.deltaY > 0 ? 1 : -1;
                container.scrollBy({
                    left: direction * scrollDistance,
                    behavior: 'smooth',
                });
            }
        },
        [isHovering],
    );

    // 滚动一屏
    const scrollByPage = useCallback((direction: 'left' | 'right') => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        const scrollAmount = container.clientWidth * 0.8;
        container.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
        });
    }, []);

    return (
        <div
            className={cn('post-view-scroll-wrapper relative w-full h-[75vh]', className)}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* 左侧渐隐遮罩 */}
            <AnimatePresence>
                {canScrollLeft && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.9 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                            'pointer-events-none absolute top-0 left-0 z-10',
                            'h-full w-24',
                            'from-background via-background/40 bg-gradient-to-r to-transparent',
                        )}
                        style={{
                            maskImage:
                                'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
                            WebkitMaskImage:
                                'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
                        }}
                    />
                )}
            </AnimatePresence>

            {/* 右侧渐隐遮罩 */}
            <AnimatePresence>
                {canScrollRight && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.9 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                            'pointer-events-none absolute top-0 right-0 z-10',
                            'h-full w-24',
                            'from-background via-background/40 bg-gradient-to-l to-transparent',
                        )}
                        style={{
                            maskImage:
                                'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
                            WebkitMaskImage:
                                'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
                        }}
                    />
                )}
            </AnimatePresence>

            {/* 左箭头按钮 */}
            <AnimatePresence>
                {canScrollLeft && isHovering && (
                    <motion.button
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => scrollByPage('left')}
                        className={cn(
                            'absolute top-1/2 left-4 z-20 -translate-y-1/2',
                            'flex h-12 w-12 items-center justify-center',
                            'bg-background/80 rounded-full backdrop-blur-sm',
                            'border-border border shadow-lg',
                            'hover:bg-background hover:scale-110',
                            'transition-all duration-200',
                            'focus-visible:ring-ring focus:outline-none focus-visible:ring-2',
                        )}
                        aria-label="向左滚动"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* 右箭头按钮 */}
            <AnimatePresence>
                {canScrollRight && isHovering && (
                    <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => scrollByPage('right')}
                        className={cn(
                            'absolute top-1/2 right-4 z-20 -translate-y-1/2',
                            'flex h-12 w-12 items-center justify-center',
                            'bg-background/80 rounded-full backdrop-blur-sm',
                            'border-border border shadow-lg',
                            'hover:bg-background hover:scale-110',
                            'transition-all duration-200',
                            'focus-visible:ring-ring focus:outline-none focus-visible:ring-2',
                        )}
                        aria-label="向右滚动"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* 滚动容器 */}
            <div
                ref={containerRef}
                onWheel={handleWheel}
                className={cn(
                    'post-view-scroll-container',
                    'flex h-full items-center gap-[60px] overflow-x-auto scroll-smooth',
                    'px-[5%] py-4',
                    'scrollbar-none',
                    '[&::-webkit-scrollbar]:hidden',
                    '[-ms-overflow-style:none]',
                    '[scrollbar-width:none]',
                    'touch-pan-x',
                )}
                role="list"
                aria-label="文章列表"
            >
                {children}
            </div>
        </div>
    );
}
