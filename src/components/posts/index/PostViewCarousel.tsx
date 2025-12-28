import * as React from 'react';
import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Post, PostTag } from '@api/ghost/types';
import { PostType } from '@api/ghost/types';
import { Chip } from '@components/common/badge';
import { cn } from '@components/common/lib/utils';

interface PostViewCarouselProps {
    posts: Post[];
    className?: string;
}

interface PostCardProps {
    post: Post;
    index: number;
    isOtherHovered: boolean;
    onHover: (index: number | null) => void;
}

// 获取帖子类型图标
function getPostTypeIcon(postType: string): string {
    switch (postType) {
        case PostType.ARTICLE:
            return '📝';
        case PostType.MUSIC:
            return '🎵';
        case PostType.VIDEO:
            return '🎬';
        case PostType.GALLERY:
            return '🖼️';
        default:
            return '📄';
    }
}

// 单个卡片组件
function PostCard({ post, index, isOtherHovered, onHover }: PostCardProps) {
    const hasImage =
        post.feature_image && post.feature_image.toString().length > 0;

    // 获取要显示的标签（最多3个）
    const displayTags = React.useMemo(() => {
        if (!post.post_general_tags || post.post_general_tags.length === 0)
            return [];
        return post.post_general_tags.slice(0, 3);
    }, [post.post_general_tags]);

    // 分类
    const category = post.post_category || null;
    const typeIcon = getPostTypeIcon(post.post_type);

    return (
        <motion.a
            href={`/posts/${post.id}`}
            className={cn(
                'post-view-card group relative flex-shrink-0 overflow-hidden rounded-3xl',
                'w-64 sm:w-72 md:w-80 lg:w-[22rem]',
                'aspect-[9/14] cursor-pointer',
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

            {/* 渐变遮罩 */}
            <div
                className={cn(
                    'absolute inset-0',
                    'bg-gradient-to-t from-black/85 via-black/40 to-black/20',
                    'dark:from-black/90 dark:via-black/50 dark:to-black/30',
                )}
            />

            {/* 内容区域 */}
            <div className="absolute inset-0 flex flex-col p-5">
                {/* 顶部：类型和系列标签 */}
                <div className="flex items-center justify-between">
                    <Chip
                        variant="flat"
                        colorScheme="primary"
                        className="bg-white/20 backdrop-blur-sm"
                    >
                        {typeIcon} {post.post_type}
                    </Chip>
                    {post.post_series && (
                        <Chip
                            variant="flat"
                            colorScheme="secondary"
                            className="bg-white/20 backdrop-blur-sm"
                        >
                            {post.post_series}
                        </Chip>
                    )}
                </div>

                {/* 中间：标题和摘要 */}
                <div className="mt-auto">
                    {/* 分类 */}
                    {category && (
                        <div className="mb-2">
                            <span className="text-xs font-medium tracking-wider text-white/70 uppercase">
                                {category}
                            </span>
                        </div>
                    )}

                    {/* 标题 */}
                    <h3
                        className={cn(
                            'text-xl leading-tight font-bold text-white',
                            'line-clamp-2 mb-3',
                            'transition-colors group-hover:text-white/90',
                        )}
                    >
                        {post.title}
                    </h3>

                    {/* 摘要 */}
                    <p className="text-sm text-white/80 line-clamp-3 mb-4">
                        {post.excerpt}
                    </p>

                    {/* 底部：日期和标签 */}
                    <div className="space-y-2">
                        <div className="text-xs text-white/60">
                            {post.published_at.split('T')[0]}
                        </div>

                        {/* 标签 */}
                        {displayTags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {displayTags.map(
                                    (tagName: string, tagIndex: number) => (
                                        <Chip
                                            key={tagIndex}
                                            variant="flat"
                                            colorScheme="success"
                                            className="bg-white/15 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm"
                                        >
                                            {tagName}
                                        </Chip>
                                    ),
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Hover 阴影增强 */}
            <div
                className={cn(
                    'absolute inset-0 rounded-3xl',
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
                'flex-shrink-0 overflow-hidden rounded-3xl',
                'w-64 sm:w-72 md:w-80 lg:w-[22rem]',
                'aspect-[9/14]',
                'bg-muted animate-pulse',
            )}
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <div className="flex h-full flex-col justify-between p-5">
                <div className="flex justify-between">
                    <div className="bg-muted-foreground/20 h-6 w-20 rounded-full" />
                    <div className="bg-muted-foreground/20 h-6 w-16 rounded-full" />
                </div>
                <div className="space-y-3">
                    <div className="bg-muted-foreground/20 h-3 w-16 rounded" />
                    <div className="bg-muted-foreground/20 h-6 w-full rounded" />
                    <div className="bg-muted-foreground/20 h-6 w-3/4 rounded" />
                    <div className="space-y-2">
                        <div className="bg-muted-foreground/20 h-4 w-full rounded" />
                        <div className="bg-muted-foreground/20 h-4 w-full rounded" />
                        <div className="bg-muted-foreground/20 h-4 w-2/3 rounded" />
                    </div>
                    <div className="bg-muted-foreground/20 h-3 w-24 rounded" />
                </div>
            </div>
        </div>
    );
}

// 主组件
export default function PostViewCarousel({
    posts,
    className,
}: PostViewCarouselProps) {
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
                const card = container.querySelector('.post-view-card');
                const cardWidth = card?.getBoundingClientRect().width || 352;
                const gap = 24; // gap-6 = 24px
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
            className={cn('relative w-full h-[75vh]', className)}
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
                            'h-full w-32',
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
                            'h-full w-32',
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

            {/* 卡片滚动容器 */}
            <div
                ref={containerRef}
                onWheel={handleWheel}
                className={cn(
                    'flex h-full items-center gap-6 overflow-x-auto scroll-smooth',
                    'px-[5%] py-4',
                    // 隐藏滚动条但保留功能
                    'scrollbar-none',
                    '[&::-webkit-scrollbar]:hidden',
                    '[-ms-overflow-style:none]',
                    '[scrollbar-width:none]',
                    // 触控优化
                    'touch-pan-x',
                )}
                role="list"
                aria-label="文章列表"
            >
                {posts.map((post, index) => (
                    <PostCard
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
export function PostViewCarouselSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="relative w-full h-[75vh]">
            <div
                className={cn(
                    'flex h-full items-center gap-6 overflow-hidden',
                    'px-[5%] py-4',
                )}
            >
                {Array.from({ length: count }).map((_, index) => (
                    <SkeletonCard key={index} index={index} />
                ))}
            </div>
        </div>
    );
}
