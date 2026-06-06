import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import type { FeaturedPost } from '@api/ghost/types';
import { cn } from '@components/common/lib/utils';
import { getUIText, DEFAULT_LOCALE, type Locale } from '@lib/i18n';
import { useHorizontalScroll } from '@components/common/lib/useHorizontalScroll';

function isVisibleTag(value: string | null | undefined): value is string {
    return Boolean(value && value.trim() && value.trim().toLowerCase() !== 'default');
}

function titleCaseTag(value: string): string {
    return value
        .trim()
        .replace(/[-_]+/g, ' ')
        .replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

function getHomeTitleDensity(title: string): 'normal' | 'long' {
    return Array.from(title.trim()).length > 34 ? 'long' : 'normal';
}

function getPublishedDate(value: string | null | undefined): string {
    return value?.split('T')[0] ?? '';
}

function getTagPillClass(tone: 'type' | 'category'): string {
    const base =
        'inline-flex min-h-6 max-w-[min(9rem,44%)] items-center overflow-hidden rounded-full border px-2.5 py-1 text-[0.65rem] font-extrabold leading-none text-white/90 shadow-sm backdrop-blur-md [text-shadow:0_1px_8px_rgba(3,7,18,0.5)]';

    const tones = {
        type: 'border-cyan-200/50 bg-cyan-300/15',
        category: 'border-lime-200/45 bg-lime-300/15',
    };

    return cn(base, tones[tone]);
}

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

interface ShowcaseCardProps {
    post: FeaturedPost;
    index: number;
    isOtherHovered: boolean;
    onHover: (index: number | null) => void;
    prefersReducedMotion: boolean;
}

// 单个卡片组件
function ShowcaseCard({
    post,
    index,
    isOtherHovered,
    onHover,
    prefersReducedMotion,
}: ShowcaseCardProps) {
    const hasImage = post.feature_image && post.feature_image.toString().length > 0;
    const titleDensity = getHomeTitleDensity(post.title);
    const publishedDate = getPublishedDate(post.published_at);
    const typeLabel = isVisibleTag(post.post_type) ? titleCaseTag(post.post_type) : '';
    const categoryLabel = isVisibleTag(post.post_category) ? titleCaseTag(post.post_category) : '';

    return (
        <motion.a
            href={post.url?.toString() || '#'}
            data-title-density={titleDensity}
            className={cn(
                // layout / stacking
                'showcase-card group relative isolate flex-shrink-0 overflow-hidden rounded-[1.45rem] sm:rounded-[1.65rem]',
                'aspect-[4/3] w-[15rem] cursor-pointer sm:w-[17rem] md:w-[19rem] lg:w-[21rem]',

                // media-card material
                'border border-white/20 dark:border-white/20',
                'ring-1 ring-white/10 ring-inset',
                'bg-slate-950/25',
                'shadow-xl shadow-black/25',

                // motion / interaction
                'transition-[opacity,border-color,box-shadow] duration-300 ease-out',
                'hover:border-white/30 hover:shadow-2xl hover:shadow-black/30',

                // accessibility
                'focus-visible:ring-ring focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
            )}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{
                opacity: isOtherHovered ? 0.66 : 1,
                y: 0,
                scale: prefersReducedMotion ? 1 : isOtherHovered ? 0.985 : 1,
            }}
            transition={
                prefersReducedMotion
                    ? { duration: 0 }
                    : {
                          duration: 0.22,
                          delay: index * 0.05,
                          ease: 'easeOut',
                      }
            }
            whileHover={
                prefersReducedMotion
                    ? { opacity: 1 }
                    : {
                          scale: 1.025,
                          y: -5,
                          opacity: 1,
                          transition: { duration: 0.16, ease: [0.22, 1, 0.36, 1] },
                      }
            }
            whileFocus={prefersReducedMotion ? { opacity: 1 } : { scale: 1.025, y: -5, opacity: 1 }}
            onPointerEnter={() => onHover(index)}
            onPointerLeave={() => onHover(null)}
            onFocus={() => onHover(index)}
            onBlur={() => onHover(null)}
            aria-label={`阅读文章: ${post.title}`}
        >
            {/* 背景层 */}
            <div className="absolute inset-0 -z-30 overflow-hidden">
                {hasImage ? (
                    <img
                        src={post.feature_image.toString()}
                        alt=""
                        loading={index < 2 ? 'eager' : 'lazy'}
                        decoding="async"
                        className={cn(
                            'h-full w-full object-cover object-center',
                            'scale-[1.025] transition-[filter,transform] duration-700 will-change-transform',
                            'group-hover:scale-[1.055] group-hover:contrast-[1.02] group-hover:saturate-[1.12]',
                            'motion-reduce:transform-none motion-reduce:transition-none'
                        )}
                    />
                ) : (
                    <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,var(--card-image-fallback-highlight),transparent_32%),linear-gradient(135deg,var(--card-image-fallback-start),var(--card-image-fallback-end))]" />
                )}
            </div>

            {/* 图片遮罩：对齐 posts 卡片的全尺寸 media 语言 */}
            <div
                className="pointer-events-none absolute inset-0 -z-20"
                style={{
                    background: `
                        linear-gradient(rgba(0, 0, 0, 0.48), rgba(0, 0, 0, 0.48)),
                        linear-gradient(
                            180deg,
                            rgba(5, 8, 15, 0.12) 0%,
                            transparent 30%,
                            transparent 48%,
                            rgba(5, 8, 15, 0.3) 100%
                        )
                    `,
                }}
            />

            <div className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-[opacity,transform] duration-500 ease-out group-hover:opacity-100">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_16%,rgba(255,255,255,0.16),transparent_34%),linear-gradient(160deg,rgba(125,211,252,0.13),transparent_38%)]" />
                <div className="absolute inset-0 ring-1 ring-white/15 ring-inset" />
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[66%] bg-gradient-to-t from-black/75 via-black/40 to-transparent" />

            {/* 标签只保留文章类型和分类 */}
            <div
                className="pointer-events-none absolute top-3 right-3 left-3 z-20 flex items-start justify-between gap-3 sm:top-4 sm:right-4 sm:left-4"
                aria-label="Post type and category"
            >
                {typeLabel ? (
                    <span className={getTagPillClass('type')}>{typeLabel}</span>
                ) : (
                    <span />
                )}
                {categoryLabel && (
                    <span className={getTagPillClass('category')}>{categoryLabel}</span>
                )}
            </div>

            {/* 标题落在底部渐变上，不再使用黑色药丸背景 */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-3 pt-16 pb-3 sm:px-4 sm:pt-20 sm:pb-4">
                <h3
                    className={cn(
                        'm-0 overflow-hidden font-extrabold text-white',
                        'leading-tight [text-shadow:0_2px_12px_rgba(3,7,18,0.82)]',
                        titleDensity === 'long'
                            ? 'line-clamp-2 text-[0.92rem] sm:line-clamp-3 sm:text-[1rem]'
                            : 'line-clamp-2 text-[1.03rem] sm:text-[1.1rem]'
                    )}
                >
                    {post.title}
                </h3>
                {publishedDate && (
                    <time
                        className="mt-2 block text-[0.68rem] leading-none font-bold text-white/70 [text-shadow:0_1px_8px_rgba(3,7,18,0.72)]"
                        dateTime={publishedDate}
                    >
                        {publishedDate}
                    </time>
                )}
            </div>
        </motion.a>
    );
}

// Skeleton 占位卡片
function SkeletonCard({ index }: { index: number }) {
    return (
        <div
            className={cn(
                'flex-shrink-0 overflow-hidden rounded-[1.45rem] sm:rounded-[1.65rem]',
                'w-[15rem] sm:w-[17rem] md:w-[19rem] lg:w-[21rem]',
                'aspect-[4/3]',
                'bg-muted/80 animate-pulse border border-white/15 ring-1 ring-white/10 ring-inset'
            )}
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <div className="flex h-full flex-col justify-between p-4">
                {/* 顶部标签占位 */}
                <div className="flex items-center justify-between">
                    <div className="bg-muted-foreground/20 h-6 w-20 rounded-full" />
                    <div className="bg-muted-foreground/20 h-6 w-24 rounded-full" />
                </div>
                {/* 底部标题占位 */}
                <div className="mt-auto space-y-2">
                    <div className="bg-muted-foreground/20 h-5 w-full rounded" />
                    <div className="bg-muted-foreground/20 h-5 w-3/4 rounded" />
                    <div className="bg-muted-foreground/20 h-3 w-20 rounded" />
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
    locale: Locale;
    prefersReducedMotion: boolean;
}

function ViewMoreCard({
    href,
    index,
    isOtherHovered,
    onHover,
    locale,
    prefersReducedMotion,
}: ViewMoreCardProps) {
    const viewAllText = getUIText('home', 'viewAllPosts', locale);
    const exploreMoreText = getUIText('home', 'exploreMore', locale);

    return (
        <motion.a
            href={href}
            className={cn(
                'showcase-card group relative isolate flex-shrink-0 overflow-hidden rounded-[1.45rem] sm:rounded-[1.65rem]',
                'w-[15rem] sm:w-[17rem] md:w-[19rem] lg:w-[21rem]',
                'aspect-[4/3] cursor-pointer',
                'focus-visible:ring-ring focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                'border border-white/20 bg-slate-950/25 shadow-xl shadow-black/25',
                'ring-1 ring-white/10 ring-inset',
                'transition-[opacity,border-color,box-shadow] duration-300 ease-out',
                'hover:border-white/30 hover:shadow-2xl hover:shadow-black/30'
            )}
            initial={prefersReducedMotion ? false : { opacity: 0, x: 50 }}
            animate={{
                opacity: isOtherHovered ? 0.66 : 1,
                x: 0,
                scale: prefersReducedMotion ? 1 : isOtherHovered ? 0.985 : 1,
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
                          scale: 1.025,
                          y: -5,
                          opacity: 1,
                          transition: { duration: 0.16, ease: [0.22, 1, 0.36, 1] },
                      }
            }
            whileFocus={prefersReducedMotion ? { opacity: 1 } : { scale: 1.025, y: -5, opacity: 1 }}
            onPointerEnter={() => onHover(index)}
            onPointerLeave={() => onHover(null)}
            aria-label={viewAllText}
        >
            <div className="absolute inset-0 -z-30 overflow-hidden">
                <div className="h-full w-full scale-[1.025] bg-[radial-gradient(circle_at_28%_18%,var(--card-image-fallback-highlight),transparent_34%),linear-gradient(135deg,var(--card-image-fallback-start),var(--card-image-fallback-end))] transition-transform duration-700 group-hover:scale-[1.055]" />
            </div>

            <div
                className="pointer-events-none absolute inset-0 -z-20"
                style={{
                    background: `
                        linear-gradient(rgba(0, 0, 0, 0.42), rgba(0, 0, 0, 0.42)),
                        linear-gradient(
                            180deg,
                            rgba(5, 8, 15, 0.08) 0%,
                            transparent 36%,
                            rgba(5, 8, 15, 0.28) 100%
                        )
                    `,
                }}
            />

            <div className="pointer-events-none absolute inset-0 -z-10 opacity-80 transition-opacity duration-500 group-hover:opacity-100">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.18),transparent_35%),linear-gradient(160deg,rgba(125,211,252,0.16),transparent_40%)]" />
                <div className="absolute inset-0 ring-1 ring-white/15 ring-inset" />
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[66%] bg-gradient-to-t from-black/75 via-black/40 to-transparent" />

            <div className="absolute inset-0 z-20 flex items-center justify-center">
                <div
                    className={cn(
                        'flex h-14 w-14 items-center justify-center rounded-full',
                        'border border-white/25 bg-white/[0.14] shadow-lg shadow-black/20 backdrop-blur-md',
                        'transition-[background,transform] duration-300 ease-out',
                        'group-hover:scale-105 group-hover:bg-white/20'
                    )}
                >
                    <ArrowRight className="h-7 w-7 text-white transition-transform duration-300 group-hover:translate-x-0.5" />
                </div>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-3 pt-16 pb-3 sm:px-4 sm:pt-20 sm:pb-4">
                <h3 className="m-0 line-clamp-2 text-[1.03rem] leading-tight font-extrabold text-white [text-shadow:0_2px_12px_rgba(3,7,18,0.82)] sm:text-[1.1rem]">
                    {viewAllText}
                </h3>
                <p className="mt-2 line-clamp-1 text-[0.68rem] leading-none font-bold text-white/70 [text-shadow:0_1px_8px_rgba(3,7,18,0.72)]">
                    {exploreMoreText}
                </p>
            </div>
        </motion.a>
    );
}

// 主组件
export default function PostsShowcaseCarousel({
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
        requireHover: true,
        dependencyKey: `${posts.length}:${showMoreButton}`,
    });

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
