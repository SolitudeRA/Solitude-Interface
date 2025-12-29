import * as React from 'react';
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAtomValue } from 'jotai';
import { cn } from '@components/common/lib/utils';
import { postViewAtom, activePostDateAtom } from '@stores/postViewAtom';

import type { FeaturedPost } from '@api/ghost/types';

interface DockTimelineContainerProps {
    posts: FeaturedPost[];
}

/**
 * 格式化日期显示
 */
function formatDate(dateString: string | null): string {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}.${month}.${day}`;
    } catch {
        return '';
    }
}

export default function DockTimelineContainer({
    posts,
}: DockTimelineContainerProps) {
    const postViewState = useAtomValue(postViewAtom);
    const activeDate = useAtomValue(activePostDateAtom);

    const { totalPosts, activeIndex, visibleIndices } = postViewState;

    // 计算刻度的数量和当前位置比例
    const tickCount = useMemo(() => {
        return Math.max(totalPosts, posts.length, 1);
    }, [totalPosts, posts.length]);

    const activeRatio = useMemo(() => {
        if (tickCount <= 1) return 0.5;
        return activeIndex / (tickCount - 1);
    }, [activeIndex, tickCount]);

    // 格式化的日期
    const formattedDate = useMemo(() => {
        // 优先使用从 atom 获取的日期
        if (activeDate) {
            return formatDate(activeDate);
        }
        // 降级使用 props 中的日期
        if (posts[activeIndex]?.published_at) {
            return formatDate(posts[activeIndex].published_at);
        }
        return '';
    }, [activeDate, posts, activeIndex]);

    return (
        <div className="flex h-14 min-h-[50px] w-[90%] flex-col items-center justify-center gap-1">
            {/* 日期显示 */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={formattedDate}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.2 }}
                    className="text-foreground/80 text-sm font-medium tabular-nums"
                >
                    {formattedDate || '----.--.--'}
                </motion.div>
            </AnimatePresence>

            {/* 时间线刻度尺 */}
            <div className="relative flex h-4 w-full items-end justify-center gap-[3px]">
                {/* 刻度 */}
                {Array.from({ length: tickCount }, (_, index) => {
                    const isActive = index === activeIndex;
                    const isVisible = visibleIndices.includes(index);

                    return (
                        <motion.div
                            key={index}
                            className={cn(
                                'w-0.5 rounded-t-sm transition-colors duration-200',
                                isActive
                                    ? 'bg-foreground'
                                    : isVisible
                                      ? 'bg-foreground/50'
                                      : 'bg-foreground/20',
                            )}
                            initial={false}
                            animate={{
                                height: isActive ? 14 : isVisible ? 10 : 6,
                            }}
                            transition={{
                                type: 'spring',
                                stiffness: 400,
                                damping: 25,
                            }}
                        />
                    );
                })}

                {/* 当前位置指示器（滑块） */}
                {tickCount > 1 && (
                    <motion.div
                        className="bg-primary/30 pointer-events-none absolute bottom-0 h-full rounded-sm"
                        style={{
                            width: `${Math.max(100 / tickCount, 10)}%`,
                        }}
                        initial={false}
                        animate={{
                            left: `${activeRatio * (100 - Math.max(100 / tickCount, 10))}%`,
                        }}
                        transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 30,
                        }}
                    />
                )}
            </div>

            {/* 位置指示文字 */}
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <span className="tabular-nums">
                    {activeIndex + 1} / {tickCount}
                </span>
            </div>
        </div>
    );
}
