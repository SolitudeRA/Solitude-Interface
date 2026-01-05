import * as React from 'react';
import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import type { FeaturedPost } from '@api/ghost/types';
import { Chip } from '@components/common/badge';
import { cn } from '@components/common/lib/utils';

// 颜色方案类型（与 badge.tsx 保持一致）
type ChipColorScheme =
    | 'default'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'info'
    | 'purple'
    | 'rose';

// Type 配置：不同文章类型使用不同颜色
const DEFAULT_TYPE_CONFIG = {
    colorScheme: 'secondary' as ChipColorScheme,
};

const TYPE_CONFIG: Record<string, { colorScheme: ChipColorScheme }> = {
    article: { colorScheme: 'primary' }, // 蓝色 - 经典、专业
    gallery: { colorScheme: 'purple' }, // 紫色 - 艺术、创意
    video: { colorScheme: 'rose' }, // 玫红 - 热情、动感
    music: { colorScheme: 'warning' }, // 琥珀 - 温暖、活力
    default: DEFAULT_TYPE_CONFIG,
};

// Category 配置：不同分类使用不同颜色
const DEFAULT_CATEGORY_CONFIG = {
    colorScheme: 'secondary' as ChipColorScheme,
};

const CATEGORY_CONFIG: Record<string, { colorScheme: ChipColorScheme }> = {
    tech: { colorScheme: 'info' }, // 青色 - 科技感
    life: { colorScheme: 'success' }, // 绿色 - 生活、自然
    default: DEFAULT_CATEGORY_CONFIG,
};

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
}

interface ShowcaseCardProps {
    post: FeaturedPost;
    index: number;
    isOtherHovered: boolean;
    onHover: (index: number | null) => void;
}

// 单个卡片组件
function ShowcaseCard({
    post,
    index,
    isOtherHovered,
    onHover,
}: ShowcaseCardProps) {
    const hasImage =
        post.feature_image && post.feature_image.toString().length > 0;

    // 获取 type 配置
    const typeKey = post.post_type?.toLowerCase() || 'default';
    const typeConfig = TYPE_CONFIG[typeKey] ?? DEFAULT_TYPE_CONFIG;

    // 获取 category 配置
    const categoryKey = post.post_category?.toLowerCase() || 'default';
    const categoryConfig =
        CATEGORY_CONFIG[categoryKey] ?? DEFAULT_CATEGORY_CONFIG;

    return (
        <motion.a
            href={post.url?.toString() || '#'}
            className={cn(
                'showcase-card group relative flex-shrink-0 overflow-hidden rounded-xl',
                'w-56 sm:w-64 md:w-72 lg:w-80',
                'aspect-[16/11] cursor-pointer',
                'focus-visible:ring-ring focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                'shadow-lg',
            )}
            initial={{ opacity: 0, x: 50 }}
            animate={{
                opacity: isOtherHovered ? 0.6 : 1,
                x: 0,
                scale: isOtherHovered ? 0.98 : 1,
            }}
            transition={{
                duration: 0.15,
                delay: index * 0.05,
                ease: 'easeOut',
            }}
            whileHover={{
                scale: 1.03,
                y: -6,
                opacity: 1,
                transition: { duration: 0.1, ease: 'easeOut' },
            }}
            whileFocus={{
                scale: 1.03,
                y: -6,
                opacity: 1,
            }}
            onMouseEnter={() => onHover(index)}
            onMouseLeave={() => onHover(null)}
            aria-label={`阅读文章: ${post.title}`}
        >
            {/* 背景图片或渐变 fallback */}
            <div className="absolute inset-0 overflow-hidden">
                {hasImage ? (
                    <div
                        className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                        style={{
                            backgroundImage: `url(${post.feature_image?.toString()})`,
                        }}
                    />
                ) : (
                    <div className="from-primary/30 via-secondary/20 to-accent/30 h-full w-full bg-gradient-to-br" />
                )}
            </div>

            {/* 渐变遮罩 - 使用首页卡片专用的 CSS 变量 */}
            <div
                className="absolute inset-0 rounded-xl"
                style={{
                    background: `linear-gradient(
                        to top,
                        var(--home-card-overlay-end) 0%,
                        var(--home-card-overlay-mid) 40%,
                        var(--home-card-overlay-start) 100%
                    )`,
                }}
            />

            {/* 内容区域 */}
            <div className="absolute inset-0 flex flex-col justify-between p-4">
                {/* 顶部标签区 - 与 BaseCard 保持一致 */}
                <div className="flex items-center justify-between">
                    {/* 左上角：Type 标签 */}
                    {post.post_type && (
                        <Chip
                            variant="flat"
                            colorScheme={typeConfig.colorScheme}
                            className="backdrop-blur-sm"
                        >
                            {post.post_type}
                        </Chip>
                    )}
                    {/* 右上角：Category 标签 */}
                    {post.post_category && (
                        <Chip
                            variant="flat"
                            colorScheme={categoryConfig.colorScheme}
                            className="backdrop-blur-sm"
                        >
                            {post.post_category}
                        </Chip>
                    )}
                </div>

                {/* 底部：标题 */}
                <h3
                    className={cn(
                        'text-lg leading-tight font-bold',
                        'line-clamp-2',
                        'transition-colors',
                    )}
                    style={{ color: 'var(--post-view-card-title)' }}
                >
                    {post.title}
                </h3>
            </div>

            {/* Hover 阴影增强 */}
            <div
                className={cn(
                    'absolute inset-0 rounded-2xl',
                    'shadow-lg transition-shadow duration-300',
                    'group-hover:shadow-2xl group-hover:shadow-black/30',
                )}
            />
        </motion.a>
    );
}

// Skeleton 占位卡片
function SkeletonCard({ index }: { index: number }) {
    return (
        <div
            className={cn(
                'flex-shrink-0 overflow-hidden rounded-xl',
                'w-56 sm:w-64 md:w-72 lg:w-80',
                'aspect-[16/11]',
                'bg-muted animate-pulse',
            )}
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <div className="flex h-full flex-col justify-between p-4">
                {/* 顶部标签占位 */}
                <div className="flex items-center justify-between">
                    <div className="bg-muted-foreground/20 h-6 w-20 rounded-full" />
                    <div className="bg-muted-foreground/20 h-6 w-16 rounded-full" />
                </div>
                {/* 底部标题占位 */}
                <div className="space-y-2">
                    <div className="bg-muted-foreground/20 h-5 w-full rounded" />
                    <div className="bg-muted-foreground/20 h-5 w-3/4 rounded" />
                </div>
            </div>
        </div>
    );
}

// "查看更多"卡片组件
interface ViewMoreCardProps {
    href: string;
    index: number;
    isOtherHovered: boolean;
    onHover: (index: number | null) => void;
}

function ViewMoreCard({
    href,
    index,
    isOtherHovered,
    onHover,
}: ViewMoreCardProps) {
    return (
        <motion.a
            href={href}
            className={cn(
                'showcase-card group relative flex-shrink-0 overflow-hidden rounded-xl',
                'w-56 sm:w-64 md:w-72 lg:w-80',
                'aspect-[16/11] cursor-pointer',
                'focus-visible:ring-ring focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                'shadow-lg',
            )}
            initial={{ opacity: 0, x: 50 }}
            animate={{
                opacity: isOtherHovered ? 0.6 : 1,
                x: 0,
                scale: isOtherHovered ? 0.98 : 1,
            }}
            transition={{
                duration: 0.15,
                delay: index * 0.05,
                ease: 'easeOut',
            }}
            whileHover={{
                scale: 1.03,
                y: -6,
                opacity: 1,
                transition: { duration: 0.1, ease: 'easeOut' },
            }}
            whileFocus={{
                scale: 1.03,
                y: -6,
                opacity: 1,
            }}
            onMouseEnter={() => onHover(index)}
            onMouseLeave={() => onHover(null)}
            aria-label="查看全部文章"
        >
            {/* 渐变背景 */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="from-primary/40 via-secondary/30 to-accent/40 h-full w-full bg-gradient-to-br transition-all duration-500 group-hover:scale-105 group-hover:opacity-90" />
            </div>

            {/* 渐变遮罩 */}
            <div
                className={cn(
                    'absolute inset-0',
                    'bg-gradient-to-t from-black/60 via-black/20 to-transparent',
                    'dark:from-black/70 dark:via-black/30',
                )}
            />

            {/* 内容区域 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                {/* 图标 */}
                <motion.div
                    className={cn(
                        'mb-4 flex h-16 w-16 items-center justify-center',
                        'rounded-full',
                        'bg-white/20 backdrop-blur-sm',
                        'border border-white/30',
                        'transition-all duration-300',
                        'group-hover:scale-110 group-hover:bg-white/30',
                    )}
                    whileHover={{ rotate: 0 }}
                >
                    <ArrowRight className="h-8 w-8 text-white transition-transform duration-300 group-hover:translate-x-1" />
                </motion.div>

                {/* 文字 */}
                <h3
                    className={cn(
                        'text-lg leading-tight font-bold text-white',
                        'text-center',
                        'transition-colors group-hover:text-white/90',
                    )}
                >
                    查看全部文章
                </h3>
                <p className="mt-1 text-sm text-white/70">探索更多内容</p>
            </div>

            {/* Hover 阴影增强 */}
            <div
                className={cn(
                    'absolute inset-0 rounded-2xl',
                    'shadow-lg transition-shadow duration-300',
                    'group-hover:shadow-2xl group-hover:shadow-black/30',
                )}
            />
        </motion.a>
    );
}

// 主组件
export default function PostsShowcaseCarousel({
    posts,
    className,
    postsPageUrl = '/post-view',
    showMoreButton = true,
}: PostsShowcaseCarouselProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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
    }, [updateScrollState, posts]);

    // 鼠标滚轮横向滚动 - 滚一下滚过一个卡片
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

                // 计算单个卡片的滚动距离（卡片宽度 + gap）
                const card = container.querySelector('.showcase-card');
                const cardWidth = card?.getBoundingClientRect().width || 288;
                const gap = 16; // gap-4 = 16px
                const scrollDistance = cardWidth + gap;

                // 根据滚轮方向决定滚动方向
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

    // 空数据不渲染
    if (!posts || posts.length === 0) {
        return null;
    }

    return (
        <div
            className={cn('relative w-full', className)}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* 左侧渐隐遮罩 - 柔化边界 */}
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
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => scrollByPage('left')}
                        className={cn(
                            'absolute top-1/2 left-2 z-20 -translate-y-1/2',
                            'flex h-10 w-10 items-center justify-center',
                            'bg-background/80 rounded-full backdrop-blur-sm',
                            'border-border border shadow-lg',
                            'hover:bg-background hover:scale-110',
                            'transition-all duration-200',
                            'focus-visible:ring-ring focus:outline-none focus-visible:ring-2',
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
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => scrollByPage('right')}
                        className={cn(
                            'absolute top-1/2 right-2 z-20 -translate-y-1/2',
                            'flex h-10 w-10 items-center justify-center',
                            'bg-background/80 rounded-full backdrop-blur-sm',
                            'border-border border shadow-lg',
                            'hover:bg-background hover:scale-110',
                            'transition-all duration-200',
                            'focus-visible:ring-ring focus:outline-none focus-visible:ring-2',
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
                onWheel={handleWheel}
                className={cn(
                    'flex gap-4 overflow-x-auto scroll-smooth',
                    'px-4 py-2',
                    // 隐藏滚动条但保留功能
                    'scrollbar-none',
                    '[&::-webkit-scrollbar]:hidden',
                    '[-ms-overflow-style:none]',
                    '[scrollbar-width:none]',
                    // 触控优化
                    'touch-pan-x',
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
                        isOtherHovered={
                            hoveredIndex !== null && hoveredIndex !== index
                        }
                        onHover={setHoveredIndex}
                    />
                ))}
                {/* 查看更多卡片 */}
                {showMoreButton && (
                    <ViewMoreCard
                        href={postsPageUrl}
                        index={posts.length}
                        isOtherHovered={
                            hoveredIndex !== null &&
                            hoveredIndex !== posts.length
                        }
                        onHover={setHoveredIndex}
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
            <div className={cn('flex gap-4 overflow-hidden', 'px-4 py-2')}>
                {Array.from({ length: count }).map((_, index) => (
                    <SkeletonCard key={index} index={index} />
                ))}
            </div>
        </div>
    );
}
