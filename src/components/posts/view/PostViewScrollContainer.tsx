import * as React from 'react';
import { useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSetAtom, useAtomValue } from 'jotai';
import { cn } from '@components/common/lib/utils';
import { useHorizontalScroll } from '@components/common/lib/useHorizontalScroll';
import { postViewAtom, scrollToPostAtom } from '@stores/postViewAtom';
import PostViewPagination from './PostViewPagination';

interface PostViewScrollContainerProps {
    children: React.ReactNode;
    /** 各文章的发布日期数组 */
    postDates?: string[];
    className?: string;
}

const LAYOUT_CONFIG = {
    gap: 60,
    fallbackCardWidth: 300,
};

function areNumberArraysEqual(a: number[], b: number[]) {
    if (a.length !== b.length) return false;
    return a.every((value, index) => value === b[index]);
}

export default function PostViewScrollContainer({
    children,
    postDates = [],
    className,
}: PostViewScrollContainerProps) {
    const setPostViewState = useSetAtom(postViewAtom);
    const scrollToPostRequest = useAtomValue(scrollToPostAtom);
    const setScrollToPostRequest = useSetAtom(scrollToPostAtom);
    const childCount = React.Children.count(children);

    const updateVisiblePosts = useCallback(
        (container: HTMLDivElement) => {
            const cards = container.querySelectorAll('.post-card-wrapper');
            const containerRect = container.getBoundingClientRect();
            const containerCenter = containerRect.left + containerRect.width / 2;

            const visibleIndices: number[] = [];
            let closestIndex = 0;
            let closestDistance = Infinity;

            cards.forEach((card, index) => {
                const cardRect = card.getBoundingClientRect();
                const cardCenter = cardRect.left + cardRect.width / 2;

                const visibleLeft = Math.max(cardRect.left, containerRect.left);
                const visibleRight = Math.min(cardRect.right, containerRect.right);
                const visibleWidth = Math.max(0, visibleRight - visibleLeft);
                const visibilityRatio = visibleWidth / cardRect.width;

                if (visibilityRatio > 0.3) {
                    visibleIndices.push(index);
                }

                const distanceToCenter = Math.abs(cardCenter - containerCenter);
                if (distanceToCenter < closestDistance) {
                    closestDistance = distanceToCenter;
                    closestIndex = index;
                }
            });

            setPostViewState((prev) => {
                const nextPostDates = postDates.length > 0 ? postDates : prev.postDates;
                const nextActiveIndex = cards.length > 0 ? closestIndex : 0;

                if (
                    prev.totalPosts === cards.length &&
                    prev.activeIndex === nextActiveIndex &&
                    prev.postDates === nextPostDates &&
                    areNumberArraysEqual(prev.visibleIndices, visibleIndices)
                ) {
                    return prev;
                }

                return {
                    ...prev,
                    totalPosts: cards.length,
                    visibleIndices,
                    activeIndex: nextActiveIndex,
                    postDates: nextPostDates,
                };
            });
        },
        [postDates, setPostViewState]
    );

    const {
        containerRef,
        canScrollLeft,
        canScrollRight,
        isHovering,
        setIsHovering,
        prefersReducedMotion,
        handleWheel,
        scrollByPage,
        scrollToIndex,
    } = useHorizontalScroll<HTMLDivElement>({
        itemSelector: '.post-card-wrapper',
        itemGap: LAYOUT_CONFIG.gap,
        fallbackItemWidth: LAYOUT_CONFIG.fallbackCardWidth,
        requireHover: false,
        observeMutations: true,
        onScrollUpdate: updateVisiblePosts,
        dependencyKey: `${childCount}:${postDates.length}`,
    });

    const fadeMotion = prefersReducedMotion
        ? { initial: false as const, animate: { opacity: 1 }, exit: { opacity: 0 } }
        : { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };

    const leftButtonMotion = prefersReducedMotion
        ? { initial: false as const, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 0 } }
        : {
              initial: { opacity: 0, x: 10 },
              animate: { opacity: 1, x: 0 },
              exit: { opacity: 0, x: 10 },
          };

    const rightButtonMotion = prefersReducedMotion
        ? { initial: false as const, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 0 } }
        : {
              initial: { opacity: 0, x: -10 },
              animate: { opacity: 1, x: 0 },
              exit: { opacity: 0, x: -10 },
          };

    const transition = { duration: prefersReducedMotion ? 0 : 0.2 };

    useEffect(() => {
        if (postDates.length > 0) {
            setPostViewState((prev) => ({
                ...prev,
                postDates,
            }));
        }
    }, [postDates, setPostViewState]);

    const scrollToPost = useCallback(
        (index: number) => {
            scrollToIndex(index);
        },
        [scrollToIndex]
    );

    useEffect(() => {
        if (scrollToPostRequest !== null) {
            scrollToPost(scrollToPostRequest);
            setScrollToPostRequest(null);
        }
    }, [scrollToPostRequest, scrollToPost, setScrollToPostRequest]);

    return (
        <div
            className={cn('post-view-scroll-wrapper relative flex w-full flex-col', className)}
            onPointerEnter={() => setIsHovering(true)}
            onPointerLeave={() => setIsHovering(false)}
        >
            <div className="relative h-[75svh] min-h-[520px]">
                <AnimatePresence>
                    {canScrollLeft && (
                        <motion.div
                            {...fadeMotion}
                            transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
                            className={cn(
                                'pointer-events-none absolute top-0 left-0 z-10',
                                'h-full w-20 sm:w-24 lg:w-28'
                            )}
                            style={{
                                background:
                                    'linear-gradient(to right, var(--post-view-scroll-mask-start) 0%, var(--post-view-scroll-mask-end) 100%)',
                                maskImage:
                                    'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
                                WebkitMaskImage:
                                    'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
                            }}
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {canScrollRight && (
                        <motion.div
                            {...fadeMotion}
                            transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
                            className={cn(
                                'pointer-events-none absolute top-0 right-0 z-10',
                                'h-full w-20 sm:w-24 lg:w-28'
                            )}
                            style={{
                                background:
                                    'linear-gradient(to left, var(--post-view-scroll-mask-start) 0%, var(--post-view-scroll-mask-end) 100%)',
                                maskImage:
                                    'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
                                WebkitMaskImage:
                                    'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
                            }}
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {canScrollLeft && isHovering && (
                        <motion.button
                            {...leftButtonMotion}
                            transition={transition}
                            onClick={() => scrollByPage('left')}
                            className={cn(
                                'absolute top-1/2 left-4 z-20 -translate-y-1/2',
                                'flex h-12 w-12 items-center justify-center',
                                'bg-background/80 rounded-full backdrop-blur-sm',
                                'border-border border shadow-lg',
                                'hover:bg-background transition-all duration-200 hover:scale-110',
                                'focus-visible:ring-ring focus:outline-none focus-visible:ring-2'
                            )}
                            aria-label="向左滚动"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </motion.button>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {canScrollRight && isHovering && (
                        <motion.button
                            {...rightButtonMotion}
                            transition={transition}
                            onClick={() => scrollByPage('right')}
                            className={cn(
                                'absolute top-1/2 right-4 z-20 -translate-y-1/2',
                                'flex h-12 w-12 items-center justify-center',
                                'bg-background/80 rounded-full backdrop-blur-sm',
                                'border-border border shadow-lg',
                                'hover:bg-background transition-all duration-200 hover:scale-110',
                                'focus-visible:ring-ring focus:outline-none focus-visible:ring-2'
                            )}
                            aria-label="向右滚动"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </motion.button>
                    )}
                </AnimatePresence>

                <div
                    ref={containerRef}
                    onWheel={handleWheel}
                    className={cn(
                        'post-view-scroll-container',
                        'flex h-full items-center gap-[60px] overflow-x-auto scroll-smooth',
                        'scrollbar-none py-4',
                        '[&::-webkit-scrollbar]:hidden',
                        '[-ms-overflow-style:none]',
                        '[scrollbar-width:none]',
                        'touch-pan-x snap-x snap-mandatory',
                        '[&_.post-card-wrapper]:snap-center'
                    )}
                    style={{
                        paddingLeft: 'clamp(1rem, 5vw, 60px)',
                        paddingRight: 'clamp(1rem, 5vw, 60px)',
                    }}
                    role="list"
                    aria-label="文章列表"
                >
                    {children}
                </div>
            </div>

            <PostViewPagination
                onScrollToPost={scrollToPost}
                className={cn(
                    'lg:fixed lg:bottom-0 lg:left-0 lg:z-[60]',
                    'lg:min-h-[10vh] lg:w-1/3 lg:items-center lg:pt-0 lg:pb-4',
                    '3xl:px-16 lg:px-8 xl:px-10 2xl:px-12'
                )}
            />
        </div>
    );
}
