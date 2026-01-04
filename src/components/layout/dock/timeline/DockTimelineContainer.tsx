import * as React from 'react';
import { useMemo, useState, useRef, useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { cn } from '@components/common/lib/utils';
import { postViewAtom, scrollToPostAtom } from '@stores/postViewAtom';

import type { FeaturedPost } from '@api/ghost/types';

interface DockTimelineContainerProps {
    posts: FeaturedPost[];
    /** 滚动到指定文章的回调函数 */
    onScrollToPost?: (index: number) => void;
}

/** 刻度间距 */
const TICK_GAP = 16;

/**
 * 计算两个日期之间的天数差
 */
function calculateDaysBetween(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 根据天数差计算次级刻度数量
 * 使用分段策略避免极端时间跨度导致刻度过多或过少
 */
function calculateSubTickCount(daysDiff: number): number {
    if (daysDiff <= 7) return 1;
    if (daysDiff <= 14) return 2;
    if (daysDiff <= 30) return 3;
    if (daysDiff <= 60) return 4;
    if (daysDiff <= 90) return 5;
    if (daysDiff <= 180) return 6;
    return 7; // 上限
}

/**
 * 格式化日期为 MM/DD 格式
 */
function formatDateLabel(dateString: string | null): string {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${month}/${day}`;
    } catch {
        return '';
    }
}

/**
 * 时间线段数据结构
 */
interface TimelineSegment {
    postIndex: number;
    dateLabel: string;
    date: Date;
    subTickCount: number; // 到下一个主刻度之间的次级刻度数
}

/**
 * 刻度数据类型
 */
type TickData = {
    type: 'main' | 'sub' | 'boundary';
    isActive: boolean;
    isInActiveRange: boolean;
    dateLabel?: string;
    postIndex?: number; // 主刻度对应的文章索引
    /** 子刻度点击时跳转到的下一个主刻度的文章索引 */
    nextPostIndex?: number;
};

export default function DockTimelineContainer({
    posts,
    onScrollToPost,
}: DockTimelineContainerProps) {
    const postViewState = useAtomValue(postViewAtom);
    const { activeIndex, visibleIndices, postDates } = postViewState;
    const setScrollToPost = useSetAtom(scrollToPostAtom);

    // 处理点击主刻度跳转
    const handleScrollToPost = useCallback(
        (index: number) => {
            // 优先使用 atom 方式（PostViewScrollContainer 会响应）
            setScrollToPost(index);
            // 同时调用回调（如果有）
            onScrollToPost?.(index);
        },
        [setScrollToPost, onScrollToPost],
    );

    // 获取当前可见的文章信息，用于构建时间线
    const timelineSegments = useMemo<TimelineSegment[]>(() => {
        // 优先使用 atom 中的日期数据，fallback 到 props
        const dates =
            postDates.length > 0
                ? postDates
                : posts.map((p) => p.published_at || '');

        // 获取可见文章的索引（如果没有，使用前5个）
        const indices =
            visibleIndices.length > 0
                ? visibleIndices
                : posts.slice(0, 5).map((_, i) => i);

        const segments: TimelineSegment[] = [];

        for (let i = 0; i < indices.length; i++) {
            const postIndex = indices[i];
            if (postIndex === undefined) continue;

            const dateString =
                dates[postIndex] || posts[postIndex]?.published_at || null;
            const dateLabel = formatDateLabel(dateString);
            const date = dateString ? new Date(dateString) : new Date();

            // 计算到下一个主刻度的次级刻度数量
            let subTickCount = 0;
            if (i < indices.length - 1) {
                const nextIndex = indices[i + 1];
                if (nextIndex !== undefined) {
                    const nextDateString =
                        dates[nextIndex] || posts[nextIndex]?.published_at;
                    if (nextDateString && dateString) {
                        const nextDate = new Date(nextDateString);
                        const daysDiff = calculateDaysBetween(date, nextDate);
                        subTickCount = calculateSubTickCount(daysDiff);
                    }
                }
            }

            segments.push({
                postIndex,
                dateLabel,
                date,
                subTickCount,
            });
        }

        return segments;
    }, [posts, postDates, visibleIndices]);

    // 找出当前活动文章在可见段中的位置
    const activeSegmentIndex = useMemo(() => {
        return timelineSegments.findIndex(
            (seg) => seg.postIndex === activeIndex,
        );
    }, [timelineSegments, activeIndex]);

    // 计算边界刻度数量（基于边界文章的时间差）
    const boundaryTickCounts = useMemo(() => {
        const dates =
            postDates.length > 0
                ? postDates
                : posts.map((p) => p.published_at || '');
        const indices =
            visibleIndices.length > 0
                ? visibleIndices
                : posts.slice(0, 5).map((_, i) => i);

        let leftCount = 0;
        let rightCount = 0;

        // 计算左边界刻度数（第一个可见文章与之前一篇文章的时间差）
        if (indices.length > 0) {
            const firstVisibleIndex = indices[0];
            if (firstVisibleIndex !== undefined && firstVisibleIndex > 0) {
                const prevIndex = firstVisibleIndex - 1;
                const firstDateStr =
                    dates[firstVisibleIndex] ||
                    posts[firstVisibleIndex]?.published_at;
                const prevDateStr =
                    dates[prevIndex] || posts[prevIndex]?.published_at;
                if (firstDateStr && prevDateStr) {
                    const daysDiff = calculateDaysBetween(
                        new Date(firstDateStr),
                        new Date(prevDateStr),
                    );
                    leftCount = calculateSubTickCount(daysDiff);
                }
            }
        }

        // 计算右边界刻度数（最后一个可见文章与之后一篇文章的时间差）
        if (indices.length > 0) {
            const lastVisibleIndex = indices[indices.length - 1];
            if (
                lastVisibleIndex !== undefined &&
                lastVisibleIndex < posts.length - 1
            ) {
                const nextIndex = lastVisibleIndex + 1;
                const lastDateStr =
                    dates[lastVisibleIndex] ||
                    posts[lastVisibleIndex]?.published_at;
                const nextDateStr =
                    dates[nextIndex] || posts[nextIndex]?.published_at;
                if (lastDateStr && nextDateStr) {
                    const daysDiff = calculateDaysBetween(
                        new Date(lastDateStr),
                        new Date(nextDateStr),
                    );
                    rightCount = calculateSubTickCount(daysDiff);
                }
            }
        }

        return { leftCount, rightCount };
    }, [posts, postDates, visibleIndices]);

    // 构建扁平化的刻度数据（用于渲染）及活动刻度位置
    const { ticksData, activeTickIndex } = useMemo(() => {
        const ticks: TickData[] = [];
        let activeIdx = -1;

        // 左边界子刻度
        for (let i = 0; i < boundaryTickCounts.leftCount; i++) {
            ticks.push({
                type: 'boundary',
                isActive: false,
                isInActiveRange: false,
            });
        }

        // 主要内容刻度
        timelineSegments.forEach((segment, segIndex) => {
            const isActive = segment.postIndex === activeIndex;
            const isInActiveRange =
                activeSegmentIndex !== -1 &&
                (segIndex === activeSegmentIndex ||
                    segIndex === activeSegmentIndex - 1);

            // 记录活动刻度位置
            if (isActive) {
                activeIdx = ticks.length;
            }

            // 添加主刻度
            ticks.push({
                type: 'main',
                isActive,
                isInActiveRange,
                dateLabel: segment.dateLabel,
                postIndex: segment.postIndex,
            });

            // 添加次级刻度（除了最后一个段）
            if (segIndex < timelineSegments.length - 1) {
                const nextSegment = timelineSegments[segIndex + 1];
                const nextIdx = nextSegment?.postIndex;
                for (let i = 0; i < segment.subTickCount; i++) {
                    const tickData: TickData = {
                        type: 'sub',
                        isActive: false,
                        isInActiveRange,
                    };
                    // 子刻度点击跳转到下一个主刻度对应的文章
                    if (nextIdx !== undefined) {
                        tickData.nextPostIndex = nextIdx;
                    }
                    ticks.push(tickData);
                }
            }
        });

        // 右边界子刻度
        for (let i = 0; i < boundaryTickCounts.rightCount; i++) {
            ticks.push({
                type: 'boundary',
                isActive: false,
                isInActiveRange: false,
            });
        }

        return { ticksData: ticks, activeTickIndex: activeIdx };
    }, [timelineSegments, activeIndex, activeSegmentIndex, boundaryTickCounts]);

    // 计算偏移量使活动刻度居中
    const offsetX = useMemo(() => {
        if (activeTickIndex < 0 || ticksData.length === 0) return 0;

        // 刻度宽度 4px + 间距
        const tickTotalWidth = 4 + TICK_GAP;
        const centerPosition = (ticksData.length - 1) / 2;
        return (centerPosition - activeTickIndex) * tickTotalWidth;
    }, [activeTickIndex, ticksData.length]);

    // Dock式hover效果的状态
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);

    // 处理鼠标移动，计算最近的刻度索引
    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;

            // 刻度总宽度
            const tickWidth = 4 + TICK_GAP;
            // 计算偏移后的鼠标位置对应的刻度索引
            const totalWidth = ticksData.length * tickWidth;
            const startX = (rect.width - totalWidth) / 2 + offsetX;
            const relativeX = mouseX - startX;
            const index = Math.round(relativeX / tickWidth);

            if (index >= 0 && index < ticksData.length) {
                setHoverIndex(index);
            } else {
                setHoverIndex(null);
            }
        },
        [ticksData.length, offsetX],
    );

    const handleMouseLeave = useCallback(() => {
        setHoverIndex(null);
    }, []);

    // 处理点击刻度行容器（包括gap区域）
    const handleTickRowClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;

            // 刻度总宽度
            const tickWidth = 4 + TICK_GAP;
            // 计算偏移后的鼠标位置对应的刻度索引
            const totalWidth = ticksData.length * tickWidth;
            const startX = (rect.width - totalWidth) / 2 + offsetX;
            const relativeX = mouseX - startX;
            const index = Math.round(relativeX / tickWidth);

            if (index >= 0 && index < ticksData.length) {
                const tick = ticksData[index];
                if (tick) {
                    if (tick.type === 'main' && tick.postIndex !== undefined) {
                        handleScrollToPost(tick.postIndex);
                    } else if (
                        tick.type === 'sub' &&
                        tick.nextPostIndex !== undefined
                    ) {
                        handleScrollToPost(tick.nextPostIndex);
                    }
                }
            }
        },
        [ticksData, offsetX, handleScrollToPost],
    );

    // 根据与hover位置的距离计算刻度的放大比例
    const getTickScale = useCallback(
        (tickIndex: number) => {
            if (hoverIndex === null) return { height: 1, gap: 1 };

            const distance = Math.abs(tickIndex - hoverIndex);
            const maxDistance = 3; // 影响范围：3个刻度

            if (distance > maxDistance) return { height: 1, gap: 1 };

            // 使用余弦函数实现平滑的放大效果
            const scale = Math.cos((distance / maxDistance) * (Math.PI / 2));
            const heightScale = 1 + scale * 0.5; // 最大放大1.5倍
            const gapScale = 1 + scale * 0.3; // 间距最大放大1.3倍

            return { height: heightScale, gap: gapScale };
        },
        [hoverIndex],
    );

    return (
        <div
            ref={containerRef}
            className="flex h-full w-[90%] flex-col items-center justify-center gap-1"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* 刻度行 - 所有刻度水平中线对齐，偏移使活动刻度居中 */}
            <div
                className="flex cursor-pointer items-center justify-center"
                style={{
                    height: 30, // 固定高度，防止hover时影响日期位置
                    transform: `translateX(${offsetX}px)`,
                    transition: 'transform 500ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onClick={handleTickRowClick}
            >
                {ticksData.map((tick, index) => {
                    const scale = getTickScale(index);
                    const baseHeight = tick.type === 'main' ? 20 : 12;
                    const scaledHeight = baseHeight * scale.height;
                    const scaledGap = TICK_GAP * scale.gap;

                    return (
                        <React.Fragment key={index}>
                            {tick.type === 'main' ? (
                                <button
                                    className={cn(
                                        'w-1 rounded-full transition-all duration-150 ease-out',
                                        'focus-visible:ring-foreground/50 focus:outline-none focus-visible:ring-2',
                                        tick.isActive
                                            ? 'bg-foreground/90'
                                            : 'bg-foreground/60',
                                    )}
                                    style={{
                                        height: scaledHeight,
                                        marginLeft:
                                            index > 0 ? scaledGap / 2 : 0,
                                        marginRight:
                                            index < ticksData.length - 1
                                                ? scaledGap / 2
                                                : 0,
                                    }}
                                    onClick={() => {
                                        if (tick.postIndex !== undefined) {
                                            handleScrollToPost(tick.postIndex);
                                        }
                                    }}
                                    aria-label={`跳转到第 ${(tick.postIndex ?? 0) + 1} 篇文章`}
                                />
                            ) : tick.type === 'sub' &&
                              tick.nextPostIndex !== undefined ? (
                                <button
                                    className={cn(
                                        'w-1 rounded-full transition-all duration-150 ease-out',
                                        'focus:outline-none',
                                        tick.isInActiveRange
                                            ? 'bg-foreground/40'
                                            : 'bg-foreground/25',
                                    )}
                                    style={{
                                        height: scaledHeight,
                                        marginLeft:
                                            index > 0 ? scaledGap / 2 : 0,
                                        marginRight:
                                            index < ticksData.length - 1
                                                ? scaledGap / 2
                                                : 0,
                                    }}
                                    onClick={() => {
                                        handleScrollToPost(tick.nextPostIndex!);
                                    }}
                                    aria-label="跳转到下一篇文章"
                                />
                            ) : (
                                <div
                                    className={cn(
                                        'w-1 rounded-full transition-all duration-150 ease-out',
                                        tick.type === 'boundary'
                                            ? 'bg-foreground/20'
                                            : tick.isInActiveRange
                                              ? 'bg-foreground/40'
                                              : 'bg-foreground/25',
                                    )}
                                    style={{
                                        height: scaledHeight,
                                        marginLeft:
                                            index > 0 ? scaledGap / 2 : 0,
                                        marginRight:
                                            index < ticksData.length - 1
                                                ? scaledGap / 2
                                                : 0,
                                    }}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* 日期标签行 - 与刻度位置对齐，同步偏移和间距 */}
            <div
                className="flex items-start justify-center"
                style={{
                    transform: `translateX(${offsetX}px)`,
                    transition: 'transform 500ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
            >
                {ticksData.map((tick, index) => {
                    const scale = getTickScale(index);
                    const scaledGap = TICK_GAP * scale.gap;

                    return (
                        <div
                            key={index}
                            className="relative flex w-1 justify-center transition-all duration-150 ease-out"
                            style={{
                                marginLeft: index > 0 ? scaledGap / 2 : 0,
                                marginRight:
                                    index < ticksData.length - 1
                                        ? scaledGap / 2
                                        : 0,
                            }}
                        >
                            {tick.type === 'main' && tick.dateLabel && (
                                <span
                                    className={cn(
                                        'absolute text-[10px] whitespace-nowrap tabular-nums transition-opacity duration-500 ease-out',
                                        tick.isActive
                                            ? 'text-foreground/80 font-medium'
                                            : 'text-foreground/40',
                                    )}
                                >
                                    {tick.dateLabel}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
