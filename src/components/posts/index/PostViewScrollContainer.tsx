import * as React from 'react';
import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSetAtom } from 'jotai';
import { cn } from '@components/common/lib/utils';
import { postViewAtom } from '@stores/postViewAtom';
import PostViewPagination from './PostViewPagination';

interface PostViewScrollContainerProps {
    children: React.ReactNode;
    /** 各文章的发布日期数组 */
    postDates?: string[];
    className?: string;
}

// 布局配置
const LAYOUT_CONFIG = {
    /** 卡片间距 */
    gap: 60,
    /** 第 N+1 篇文章露出的比例（表示后面还有文章） */
    peekRatio: 0.15,
    /** 初始显示的文章数量 */
    initialVisibleCount: 5,
};

export default function PostViewScrollContainer({
    children,
    postDates = [],
    className,
}: PostViewScrollContainerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [dynamicPadding, setDynamicPadding] = useState({ left: 0, right: 0 });

    const setPostViewState = useSetAtom(postViewAtom);

    // 计算动态 padding，使首尾文章展示更合理
    // 布局：[gap] [card1] [gap] [card2] [gap] [card3] [gap] [card4] [gap] [card5] [gap] [第6张15%]
    // 左右 padding = gap，5张卡片完整展示，第6张露出15%
    const calculateDynamicPadding = useCallback(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const cards = container.querySelectorAll('.post-card-wrapper');

        if (cards.length === 0) return;

        const firstCard = cards[0] as HTMLElement;
        const cardWidth = firstCard.getBoundingClientRect().width;
        const containerWidth = container.clientWidth;
        const { gap, peekRatio, initialVisibleCount } = LAYOUT_CONFIG;

        // 总宽度 = 左padding(gap) + 5*cardWidth + 4*gap + gap + 第6张15%
        // containerWidth = gap + 5*cardWidth + 5*gap + cardWidth*peekRatio
        // 由于卡片宽度已知，我们计算 padding = gap
        // 实际需要的宽度 = gap + 5*cardWidth + 5*gap + cardWidth*peekRatio
        //                = 6*gap + 5*cardWidth + cardWidth*peekRatio
        //                = 6*gap + cardWidth*(5 + peekRatio)

        // 使用 gap 作为 padding
        const padding = gap;

        setDynamicPadding({ left: padding, right: padding });
    }, []);

    // 初始化时计算 padding
    useEffect(() => {
        calculateDynamicPadding();

        const handleResize = () => calculateDynamicPadding();
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, [calculateDynamicPadding]);

    // 更新滚动状态
    const updateScrollState = useCallback(() => {
        if (!containerRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
        setCanScrollLeft(scrollLeft > 1);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }, []);

    // 计算可见的文章索引
    const updateVisiblePosts = useCallback(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const cards = container.querySelectorAll('.post-card-wrapper');
        const containerRect = container.getBoundingClientRect();
        const containerCenter = containerRect.left + containerRect.width / 2;

        const visibleIndices: number[] = [];
        let closestIndex = 0;
        let closestDistance = Infinity;

        cards.forEach((card, index) => {
            const cardRect = card.getBoundingClientRect();
            const cardCenter = cardRect.left + cardRect.width / 2;

            // 判断卡片是否在可视区域内（至少 30% 可见）
            const visibleLeft = Math.max(cardRect.left, containerRect.left);
            const visibleRight = Math.min(cardRect.right, containerRect.right);
            const visibleWidth = visibleRight - visibleLeft;
            const visibilityRatio = visibleWidth / cardRect.width;

            if (visibilityRatio > 0.3) {
                visibleIndices.push(index);
            }

            // 找到距离容器中心最近的卡片
            const distanceToCenter = Math.abs(cardCenter - containerCenter);
            if (distanceToCenter < closestDistance) {
                closestDistance = distanceToCenter;
                closestIndex = index;
            }
        });

        setPostViewState((prev) => ({
            ...prev,
            totalPosts: cards.length,
            visibleIndices,
            activeIndex: closestIndex,
            postDates: postDates.length > 0 ? postDates : prev.postDates,
        }));
    }, [postDates, setPostViewState]);

    // 初始化文章日期
    useEffect(() => {
        if (postDates.length > 0) {
            setPostViewState((prev) => ({
                ...prev,
                postDates,
            }));
        }
    }, [postDates, setPostViewState]);

    // 监听滚动和容器变化
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let rafId: number | null = null;
        let isScheduled = false;

        // 使用 requestAnimationFrame 节流，提升性能
        const handleScrollAndUpdate = () => {
            if (isScheduled) return;
            isScheduled = true;

            rafId = requestAnimationFrame(() => {
                updateScrollState();
                updateVisiblePosts();
                isScheduled = false;
            });
        };

        // 初始化
        updateScrollState();
        updateVisiblePosts();

        container.addEventListener('scroll', handleScrollAndUpdate, {
            passive: true,
        });

        const resizeObserver = new ResizeObserver(handleScrollAndUpdate);
        resizeObserver.observe(container);

        // 使用 MutationObserver 监听子元素变化
        const mutationObserver = new MutationObserver(handleScrollAndUpdate);
        mutationObserver.observe(container, { childList: true, subtree: true });

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
            container.removeEventListener('scroll', handleScrollAndUpdate);
            resizeObserver.disconnect();
            mutationObserver.disconnect();
        };
    }, [updateScrollState, updateVisiblePosts]);

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

    // 滚动到指定文章
    const scrollToPost = useCallback((index: number) => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        const cards = container.querySelectorAll('.post-card-wrapper');
        const targetCard = cards[index];

        if (targetCard) {
            targetCard.scrollIntoView({
                behavior: 'smooth',
                inline: 'center',
                block: 'nearest',
            });
        }
    }, []);

    return (
        <div
            className={cn(
                'post-view-scroll-wrapper relative flex w-full flex-col',
                className,
            )}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* 滚动区域容器 */}
            <div className="relative h-[75vh]">
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
                        'py-4',
                        'scrollbar-none',
                        '[&::-webkit-scrollbar]:hidden',
                        '[-ms-overflow-style:none]',
                        '[scrollbar-width:none]',
                        'touch-pan-x',
                        // scroll-snap 使滚动时卡片居中对齐
                        'snap-x snap-mandatory',
                        // 子元素居中对齐
                        '[&_.post-card-wrapper]:snap-center',
                    )}
                    style={{
                        paddingLeft: dynamicPadding.left || '5%',
                        paddingRight: dynamicPadding.right || '5%',
                    }}
                    role="list"
                    aria-label="文章列表"
                >
                    {children}
                </div>
            </div>

            {/* 底部翻页指示组件 */}
            <PostViewPagination onScrollToPost={scrollToPost} />
        </div>
    );
}
