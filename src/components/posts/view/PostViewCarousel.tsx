import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Post } from '@api/ghost/types';
import { PostType } from '@api/ghost/types';
import { Chip } from '@components/common/badge';
import { cn } from '@components/common/lib/utils';
import { useHorizontalScroll } from '@components/common/lib/useHorizontalScroll';

interface PostViewCarouselProps {
    posts: Post[];
    className?: string;
}

interface PostCardProps {
    post: Post;
    index: number;
    isOtherHovered: boolean;
    onHover: (index: number | null) => void;
    prefersReducedMotion: boolean;
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
function PostCard({ post, index, isOtherHovered, onHover, prefersReducedMotion }: PostCardProps) {
    const hasImage = post.feature_image && post.feature_image.toString().length > 0;

    // 获取要显示的标签（最多3个）
    const displayTags = useMemo(() => {
        if (!post.post_general_tags || post.post_general_tags.length === 0) return [];
        return post.post_general_tags.slice(0, 3);
    }, [post.post_general_tags]);

    // 分类
    const category = post.post_category || null;
    const typeIcon = getPostTypeIcon(post.post_type);

    return (
        <motion.a
            href={post.url.toString()}
            className={cn(
                'post-view-card group relative shrink-0 overflow-hidden rounded-3xl',
                'w-64 sm:w-72 md:w-80 lg:w-[22rem]',
                'aspect-[9/14] cursor-pointer',
                'focus-visible:ring-ring focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                'shadow-lg'
            )}
            initial={prefersReducedMotion ? false : { opacity: 0, x: 50 }}
            animate={{
                opacity: isOtherHovered ? 0.6 : 1,
                x: 0,
                scale: prefersReducedMotion ? 1 : isOtherHovered ? 0.98 : 1,
            }}
            transition={
                prefersReducedMotion
                    ? { duration: 0 }
                    : {
                          duration: 0.15,
                          delay: index * 0.05,
                          ease: 'easeOut',
                      }
            }
            whileHover={
                prefersReducedMotion
                    ? { opacity: 1 }
                    : {
                          scale: 1.03,
                          y: -6,
                          opacity: 1,
                          transition: { duration: 0.1, ease: 'easeOut' },
                      }
            }
            whileFocus={prefersReducedMotion ? { opacity: 1 } : { scale: 1.03, y: -6, opacity: 1 }}
            onPointerEnter={() => onHover(index)}
            onPointerLeave={() => onHover(null)}
            aria-label={`阅读文章: ${post.title}`}
        >
            {/* 背景图片或渐变 fallback */}
            <div className="absolute inset-0 overflow-hidden">
                {hasImage ? (
                    <img
                        src={post.feature_image.toString()}
                        alt=""
                        loading={index < 2 ? 'eager' : 'lazy'}
                        decoding="async"
                        className={cn(
                            'h-full w-full object-cover object-center',
                            'transition-transform duration-500 group-hover:scale-105',
                            'motion-reduce:transform-none motion-reduce:transition-none'
                        )}
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
                    'dark:from-black/90 dark:via-black/50 dark:to-black/30'
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
                <div className="mt-auto rounded-2xl border border-[var(--card-readable-panel-border)] bg-[var(--card-readable-panel-bg)] p-4 shadow-[0_10px_30px_var(--card-readable-panel-shadow)] backdrop-blur-sm">
                    {/* 分类 */}
                    {category && (
                        <div className="mb-2">
                            <span className="text-xs font-medium tracking-wider text-[var(--card-readable-panel-body)] uppercase opacity-75">
                                {category}
                            </span>
                        </div>
                    )}

                    {/* 标题 */}
                    <h3
                        className={cn(
                            'text-xl leading-tight font-bold text-[var(--card-readable-panel-title)]',
                            'mb-3 line-clamp-2',
                            'transition-colors'
                        )}
                    >
                        {post.title}
                    </h3>

                    {/* 摘要 */}
                    <p className="mb-4 line-clamp-3 text-sm text-[var(--card-readable-panel-body)]">
                        {post.excerpt}
                    </p>

                    {/* 底部：日期和标签 */}
                    <div className="space-y-2">
                        <div className="text-xs text-[var(--card-readable-panel-body)] opacity-70">
                            {post.published_at.split('T')[0]}
                        </div>

                        {/* 标签 */}
                        {displayTags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {displayTags.map((tagName: string, tagIndex: number) => (
                                    <Chip
                                        key={tagIndex}
                                        variant="flat"
                                        colorScheme="success"
                                        className="bg-white/15 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm"
                                    >
                                        {tagName}
                                    </Chip>
                                ))}
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
                    'group-hover:shadow-2xl group-hover:shadow-black/30'
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
                'bg-muted animate-pulse'
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
export default function PostViewCarousel({ posts, className }: PostViewCarouselProps) {
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
        itemSelector: '.post-view-card',
        itemGap: 24,
        fallbackItemWidth: 352,
        requireHover: true,
        dependencyKey: posts.length,
    });

    // 空数据不渲染
    if (!posts || posts.length === 0) {
        return null;
    }

    return (
        <div
            className={cn('relative h-[75vh] w-full', className)}
            onPointerEnter={() => setIsHovering(true)}
            onPointerLeave={() => setIsHovering(false)}
        >
            {/* 左侧渐隐遮罩 */}
            <AnimatePresence>
                {canScrollLeft && (
                    <motion.div
                        initial={prefersReducedMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 0.65 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                        className={cn(
                            'pointer-events-none absolute top-0 left-0 z-10',
                            'h-full w-20 sm:w-24 lg:w-28'
                        )}
                        style={{
                            background:
                                'linear-gradient(to right, var(--post-view-scroll-mask-start) 0%, var(--post-view-scroll-mask-end) 100%)',
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
                        initial={prefersReducedMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 0.65 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                        className={cn(
                            'pointer-events-none absolute top-0 right-0 z-10',
                            'h-full w-20 sm:w-24 lg:w-28'
                        )}
                        style={{
                            background:
                                'linear-gradient(to left, var(--post-view-scroll-mask-start) 0%, var(--post-view-scroll-mask-end) 100%)',
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
                        initial={prefersReducedMotion ? false : { opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={prefersReducedMotion ? { opacity: 0, x: 0 } : { opacity: 0, x: 10 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                        onClick={() => scrollByPage('left')}
                        className={cn(
                            'absolute top-1/2 left-4 z-20 -translate-y-1/2',
                            'flex h-12 w-12 items-center justify-center',
                            'bg-background/80 rounded-full backdrop-blur-sm',
                            'border-border border shadow-lg',
                            'hover:bg-background hover:scale-110',
                            'transition-all duration-200',
                            'focus-visible:ring-ring focus:outline-none focus-visible:ring-2'
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
                        initial={prefersReducedMotion ? false : { opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={prefersReducedMotion ? { opacity: 0, x: 0 } : { opacity: 0, x: -10 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                        onClick={() => scrollByPage('right')}
                        className={cn(
                            'absolute top-1/2 right-4 z-20 -translate-y-1/2',
                            'flex h-12 w-12 items-center justify-center',
                            'bg-background/80 rounded-full backdrop-blur-sm',
                            'border-border border shadow-lg',
                            'hover:bg-background hover:scale-110',
                            'transition-all duration-200',
                            'focus-visible:ring-ring focus:outline-none focus-visible:ring-2'
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
                    'touch-pan-x'
                )}
                role="list"
                aria-label="文章列表"
            >
                {posts.map((post, index) => (
                    <PostCard
                        key={post.id}
                        post={post}
                        index={index}
                        isOtherHovered={hoveredIndex !== null && hoveredIndex !== index}
                        onHover={setHoveredIndex}
                        prefersReducedMotion={prefersReducedMotion}
                    />
                ))}
            </div>
        </div>
    );
}

// 导出 Skeleton 版本用于加载状态
export function PostViewCarouselSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="relative h-[75vh] w-full">
            <div className={cn('flex h-full items-center gap-6 overflow-hidden', 'px-[5%] py-4')}>
                {Array.from({ length: count }).map((_, index) => (
                    <SkeletonCard key={index} index={index} />
                ))}
            </div>
        </div>
    );
}
