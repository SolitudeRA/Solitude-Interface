import * as React from 'react';
import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { FeaturedPost, PostTag } from '@api/ghost/types';
import { Chip } from '@components/common/badge';
import { cn } from '@components/common/lib/utils';

interface PostsShowcaseCarouselProps {
    posts: FeaturedPost[];
    className?: string;
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

    // 获取要显示的标签（最多3个，排除系统标签）
    const displayTags = React.useMemo(() => {
        if (!post.tags || post.tags.length === 0) return [];
        return post.tags
            .filter((tag: PostTag) => !tag.slug?.startsWith('hash-'))
            .slice(0, 3);
    }, [post.tags]);

    // 分类（primary_tag 或 post_category）
    const category = post.primary_tag?.name || post.post_category || null;

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

            {/* 渐变遮罩 - 底部信息区 */}
            <div
                className={cn(
                    'absolute inset-0',
                    'bg-gradient-to-t from-black/80 via-black/30 to-transparent',
                    'dark:from-black/90 dark:via-black/40',
                )}
            />

            {/* 顶部阴影渐变（增强可读性） */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/30 to-transparent" />

            {/* 内容区域 */}
            <div className="absolute inset-0 flex flex-col justify-end p-4">
                {/* 分类标签 */}
                {category && (
                    <div className="mb-2">
                        <span className="text-xs font-medium tracking-wider text-white/70 uppercase">
                            {category}
                        </span>
                    </div>
                )}

                {/* 标签 Pills */}
                {displayTags.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                        {displayTags.map((tag: PostTag) => (
                            <Chip
                                key={tag.id}
                                variant="flat"
                                colorScheme="primary"
                                className="bg-white/20 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm"
                            >
                                {tag.name}
                            </Chip>
                        ))}
                    </div>
                )}

                {/* 标题 */}
                <h3
                    className={cn(
                        'text-lg leading-tight font-bold text-white',
                        'line-clamp-2',
                        'transition-colors group-hover:text-white/90',
                    )}
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
            <div className="flex h-full flex-col justify-end p-4">
                <div className="bg-muted-foreground/20 mb-2 h-3 w-16 rounded" />
                <div className="mb-2 flex gap-1.5">
                    <div className="bg-muted-foreground/20 h-5 w-12 rounded-full" />
                    <div className="bg-muted-foreground/20 h-5 w-16 rounded-full" />
                </div>
                <div className="space-y-2">
                    <div className="bg-muted-foreground/20 h-5 w-full rounded" />
                    <div className="bg-muted-foreground/20 h-5 w-3/4 rounded" />
                </div>
            </div>
        </div>
    );
}

// 主组件
export default function PostsShowcaseCarousel({
    posts,
    className,
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
