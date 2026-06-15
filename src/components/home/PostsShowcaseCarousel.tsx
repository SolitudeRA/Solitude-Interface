import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { FeaturedPost } from '@api/ghost/types';
import { cn } from '@components/common/lib/utils';
import { DEFAULT_LOCALE, type Locale } from '@lib/i18n';
import { useHorizontalScroll } from '@components/common/lib/useHorizontalScroll';
import { withErrorBoundary } from '@components/common/ErrorBoundary';
import { ShowcaseCard, ViewMoreCard, SkeletonCard } from './PostsShowcaseCards';

interface PostsShowcaseCarouselProps {
    posts: FeaturedPost[];
    className?: string;
    /**
     * Posts 页面的 URL
     */
    postsPageUrl?: string;
    /**
     * 是否显示"查看更多"按钮
     * @default true
     */
    showMoreButton?: boolean;
    /**
     * 当前语言
     * @default 'zh'
     */
    locale?: Locale;
}

// 主组件
// island 入口:包一层错误边界,carousel 客户端异常不拖垮首页(降级为不渲染)
export default withErrorBoundary(PostsShowcaseCarousel, { label: 'PostsShowcaseCarousel' });

function PostsShowcaseCarousel({
    posts,
    className,
    postsPageUrl = '/post-view',
    showMoreButton = true,
    locale = DEFAULT_LOCALE,
}: PostsShowcaseCarouselProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const {
        containerRef,
        canScrollLeft,
        canScrollRight,
        isHovering,
        setIsHovering,
        prefersReducedMotion,
        handleWheel,
        scrollByPage,
    } = useHorizontalScroll<HTMLDivElement>({
        itemSelector: '.showcase-card',
        itemGap: 16,
        fallbackItemWidth: 304,
        requireHover: false,
        dependencyKey: `${posts.length}:${showMoreButton}`,
    });

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.dataset.homeShowcaseHydrated = 'true';

        return () => {
            delete container.dataset.homeShowcaseHydrated;
        };
    }, [containerRef]);

    // 空数据不渲染
    if (!posts || posts.length === 0) {
        return null;
    }

    return (
        <div
            className={cn('relative w-full', className)}
            onPointerEnter={() => setIsHovering(true)}
            onPointerLeave={() => setIsHovering(false)}
        >
            {/* 左侧渐隐遮罩 - 柔化边界 */}
            <AnimatePresence>
                {canScrollLeft && (
                    <motion.div
                        initial={prefersReducedMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 0.9 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                        className={cn(
                            'pointer-events-none absolute top-0 left-0 z-10',
                            'h-full w-24',
                            'from-background via-background/40 bg-gradient-to-r to-transparent'
                        )}
                        style={{
                            maskImage:
                                'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
                            WebkitMaskImage:
                                'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
                        }}
                    />
                )}
            </AnimatePresence>

            {/* 右侧渐隐遮罩 - 柔化边界 */}
            <AnimatePresence>
                {canScrollRight && (
                    <motion.div
                        initial={prefersReducedMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 0.9 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                        className={cn(
                            'pointer-events-none absolute top-0 right-0 z-10',
                            'h-full w-24',
                            'from-background via-background/40 bg-gradient-to-l to-transparent'
                        )}
                        style={{
                            maskImage:
                                'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
                            WebkitMaskImage:
                                'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
                        }}
                    />
                )}
            </AnimatePresence>

            {/* 左箭头按钮 */}
            <AnimatePresence>
                {canScrollLeft && isHovering && (
                    <motion.button
                        initial={prefersReducedMotion ? false : { opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={prefersReducedMotion ? { opacity: 0, x: 0 } : { opacity: 0, x: 10 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                        onClick={() => scrollByPage('left')}
                        className={cn(
                            'absolute top-1/2 left-2 z-20 -translate-y-1/2',
                            'flex h-10 w-10 items-center justify-center',
                            'bg-background/80 rounded-full backdrop-blur-sm',
                            'border-border border shadow-lg',
                            'hover:bg-background hover:scale-110',
                            'transition-all duration-200',
                            'focus-visible:ring-ring focus:outline-none focus-visible:ring-2'
                        )}
                        aria-label="向左滚动"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* 右箭头按钮 */}
            <AnimatePresence>
                {canScrollRight && isHovering && (
                    <motion.button
                        initial={prefersReducedMotion ? false : { opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={prefersReducedMotion ? { opacity: 0, x: 0 } : { opacity: 0, x: -10 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                        onClick={() => scrollByPage('right')}
                        className={cn(
                            'absolute top-1/2 right-2 z-20 -translate-y-1/2',
                            'flex h-10 w-10 items-center justify-center',
                            'bg-background/80 rounded-full backdrop-blur-sm',
                            'border-border border shadow-lg',
                            'hover:bg-background hover:scale-110',
                            'transition-all duration-200',
                            'focus-visible:ring-ring focus:outline-none focus-visible:ring-2'
                        )}
                        aria-label="向右滚动"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* 卡片滚动容器 */}
            <div
                ref={containerRef}
                data-home-showcase-scroll
                onWheel={handleWheel}
                className={cn(
                    'flex gap-4 overflow-x-auto scroll-smooth',
                    'px-4 py-3',
                    // 隐藏滚动条但保留功能
                    'scrollbar-none',
                    '[&::-webkit-scrollbar]:hidden',
                    '[-ms-overflow-style:none]',
                    '[scrollbar-width:none]',
                    // 触控优化
                    'touch-pan-x'
                )}
                style={{
                    maskImage: `
                        linear-gradient(to right, black 0%, black 75%, transparent 100%)
                    `,
                    WebkitMaskImage: `
                        linear-gradient(to right, black 0%, black 65%, transparent 100%)
                    `,
                    borderRadius: '0 24px 24px 0',
                }}
                role="list"
                aria-label="推荐文章列表"
            >
                {posts.map((post, index) => (
                    <ShowcaseCard
                        key={post.id}
                        post={post}
                        index={index}
                        isOtherHovered={hoveredIndex !== null && hoveredIndex !== index}
                        onHover={setHoveredIndex}
                        prefersReducedMotion={prefersReducedMotion}
                    />
                ))}
                {/* 查看更多卡片 */}
                {showMoreButton && (
                    <ViewMoreCard
                        href={postsPageUrl}
                        index={posts.length}
                        isOtherHovered={hoveredIndex !== null && hoveredIndex !== posts.length}
                        onHover={setHoveredIndex}
                        locale={locale}
                        prefersReducedMotion={prefersReducedMotion}
                    />
                )}
            </div>
        </div>
    );
}

// 导出 Skeleton 版本用于加载状态
export function PostsShowcaseSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="relative w-full">
            <div className={cn('flex gap-4 overflow-hidden', 'px-4 py-3')}>
                {Array.from({ length: count }).map((_, index) => (
                    <SkeletonCard key={index} index={index} />
                ))}
            </div>
        </div>
    );
}
