import { useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { cn } from '@components/common/lib/utils';
import { postViewAtom } from '@stores/postViewAtom';

interface PostViewPaginationProps {
    /** 用于滚动到指定文章的回调函数 */
    onScrollToPost: (index: number) => void;
    className?: string;
}

/** 视野外最多显示的横杠数量 */
const MAX_OUTSIDE_MARKERS = 3;
const markerTransition =
    'transition-all duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)] motion-reduce:transition-none';
const activeMarkerBackground = 'linear-gradient(90deg, #ffd166 0%, #6ee7ff 56%, #8aa2ff 100%)';

export default function PostViewPagination({ onScrollToPost, className }: PostViewPaginationProps) {
    const postViewState = useAtomValue(postViewAtom);
    const { totalPosts, visibleIndices, activeIndex } = postViewState;

    const handleMarkerClick = useCallback(
        (index: number) => {
            onScrollToPost(index);
        },
        [onScrollToPost]
    );

    // 如果没有文章，不渲染
    if (totalPosts === 0) {
        return null;
    }

    // Marker 尺寸配置
    const markerWidth = 20;
    const circleSize = 12;
    const markerGap = 10;
    const unifiedHeight = Math.max(circleSize, 4);

    // 判断是否是首尾文章（显示圆圈）
    const isEndpoint = (index: number) => index === 0 || index === totalPosts - 1;

    // 判断是否可见
    const isIndexVisible = (index: number) => visibleIndices.includes(index);

    // 计算要显示的索引范围（以 activeIndex 为中心）
    const leftCount = Math.min(activeIndex, MAX_OUTSIDE_MARKERS);
    const rightCount = Math.min(totalPosts - 1 - activeIndex, MAX_OUTSIDE_MARKERS);

    // 左侧显示的范围
    const leftStart = activeIndex - leftCount;
    const showLeftEllipsis = leftStart > 0;

    // 右侧显示的范围
    const rightEnd = activeIndex + rightCount;
    const showRightEllipsis = rightEnd < totalPosts - 1;

    // 生成要显示的索引列表
    const displayIndices: number[] = [];
    for (let i = leftStart; i <= rightEnd; i++) {
        displayIndices.push(i);
    }

    // 计算 activeIndex 在 displayIndices 中的位置
    const activePositionInDisplay = displayIndices.indexOf(activeIndex);

    // 计算偏移量：使 activeIndex 对应的 marker 居中
    const markerTotalWidth = markerWidth + markerGap;
    const totalDisplayCount = displayIndices.length;
    const centerPosition = (totalDisplayCount - 1) / 2;
    const offsetX = (centerPosition - activePositionInDisplay) * markerTotalWidth;

    // 计算横条宽度（宽度渐变效果）：距离 activeIndex 越近越宽
    const getMarkerWidth = (index: number): number => {
        const distance = Math.abs(index - activeIndex);

        if (distance === 0) return 40;
        if (distance === 1) return 28;
        if (distance === 2) return 20;
        return 14;
    };

    // 渲染单个 marker（横杠或圆圈）
    const renderMarker = (index: number) => {
        const isCircle = isEndpoint(index);
        const isVisible = isIndexVisible(index);
        const isActive = index === activeIndex;
        const dynamicWidth = getMarkerWidth(index);
        const markerBackground = isVisible
            ? 'color-mix(in oklch, var(--foreground) 60%, transparent)'
            : 'color-mix(in oklch, var(--foreground) 20%, transparent)';
        const markerBorderColor = isVisible
            ? 'color-mix(in oklch, var(--foreground) 60%, transparent)'
            : 'color-mix(in oklch, var(--foreground) 25%, transparent)';

        const baseClasses = cn(
            'rounded-full',
            markerTransition,
            'focus-visible:ring-ring focus:outline-none focus-visible:ring-2',
            isActive
                ? 'opacity-100'
                : isVisible
                  ? 'opacity-90 hover:opacity-80'
                  : 'opacity-70 hover:opacity-95'
        );

        if (isCircle) {
            // 空心圆圈样式 - 圆圈也有大小变化
            const dynamicCircleSize = circleSize + (dynamicWidth - 20) / 2;
            return (
                <button
                    key={`marker-${index}`}
                    onClick={() => handleMarkerClick(index)}
                    className={cn(
                        'rounded-full',
                        markerTransition,
                        'focus-visible:ring-ring focus:outline-none focus-visible:ring-2',
                        'bg-transparent',
                        isActive
                            ? 'border-transparent opacity-100'
                            : isVisible
                              ? 'opacity-90 hover:opacity-80'
                              : 'opacity-70 hover:opacity-95'
                    )}
                    style={{
                        width: dynamicCircleSize,
                        height: dynamicCircleSize,
                        borderWidth: isActive ? 0 : 4,
                        borderColor: isActive ? undefined : markerBorderColor,
                        background: isActive ? activeMarkerBackground : undefined,
                        boxShadow: isActive
                            ? '0 0 10px rgb(110 231 255 / 0.42), 0 0 18px rgb(138 162 255 / 0.2)'
                            : undefined,
                    }}
                    aria-current={isActive ? 'true' : undefined}
                    aria-label={index === 0 ? '跳转到第一篇文章' : '跳转到最后一篇文章'}
                />
            );
        }

        // 横杠样式 - 宽度渐变效果
        return (
            <button
                key={`marker-${index}`}
                onClick={() => handleMarkerClick(index)}
                className={cn(baseClasses, 'h-1')}
                style={{
                    width: dynamicWidth,
                    background: isActive ? activeMarkerBackground : markerBackground,
                    boxShadow: isActive
                        ? '0 0 10px rgb(110 231 255 / 0.42), 0 0 18px rgb(138 162 255 / 0.2)'
                        : undefined,
                }}
                aria-current={isActive ? 'true' : undefined}
                aria-label={`跳转到第 ${index + 1} 篇文章`}
            />
        );
    };

    return (
        <div
            className={cn(
                'post-view-pagination',
                'group relative flex h-6 w-full items-center justify-center overflow-visible pt-1 lg:h-auto',
                className
            )}
        >
            <div
                aria-hidden="true"
                className={cn(
                    'pointer-events-none absolute -inset-x-20 top-1/2 h-6 -translate-y-1/2 rounded-full blur-xl sm:-inset-x-28 lg:-inset-x-48 lg:h-28 lg:blur-2xl',
                    'opacity-[0.55] transition-opacity duration-300 ease-out group-hover:opacity-70 motion-reduce:transition-none'
                )}
                style={{
                    background:
                        'radial-gradient(ellipse at 50% 50%, rgb(110 231 255 / 0.16) 0%, rgb(138 162 255 / 0.1) 34%, rgb(255 209 102 / 0.045) 58%, rgb(138 162 255 / 0) 82%)',
                    maskImage:
                        'linear-gradient(90deg, transparent 0%, black 16%, black 84%, transparent 100%)',
                    WebkitMaskImage:
                        'linear-gradient(90deg, transparent 0%, black 16%, black 84%, transparent 100%)',
                }}
            />
            <div
                aria-hidden="true"
                className={cn(
                    'pointer-events-none absolute -inset-x-16 top-1/2 h-px -translate-y-1/2 blur-[2px] lg:-inset-x-36',
                    'opacity-25 transition-opacity duration-300 ease-out group-hover:opacity-35 motion-reduce:transition-none'
                )}
                style={{
                    background:
                        'linear-gradient(90deg, rgb(255 209 102 / 0) 0%, rgb(255 209 102 / 0.05) 18%, rgb(110 231 255 / 0.16) 50%, rgb(138 162 255 / 0.05) 82%, rgb(138 162 255 / 0) 100%)',
                    maskImage:
                        'linear-gradient(90deg, transparent 0%, black 14%, black 86%, transparent 100%)',
                    WebkitMaskImage:
                        'linear-gradient(90deg, transparent 0%, black 14%, black 86%, transparent 100%)',
                }}
            />
            {/* 整体容器，使用 transform 偏移使 activeIndex 居中 */}
            <div
                className={cn('relative z-10 flex items-center justify-center', markerTransition)}
                style={{
                    height: unifiedHeight,
                    gap: markerGap,
                    transform: `translateX(${offsetX}px)`,
                }}
            >
                {/* 左侧省略号 - 三个小圆点（间距与横条统一） */}
                {showLeftEllipsis && (
                    <button
                        onClick={() => handleMarkerClick(0)}
                        className={cn(
                            'flex items-center opacity-70 hover:opacity-90',
                            markerTransition
                        )}
                        style={{ gap: markerGap }}
                        aria-label="跳转到第一篇文章"
                    >
                        <span className="bg-foreground/30 h-1 w-1 rounded-full" />
                        <span className="bg-foreground/30 h-1 w-1 rounded-full" />
                        <span className="bg-foreground/30 h-1 w-1 rounded-full" />
                    </button>
                )}

                {/* 所有显示的 markers */}
                {displayIndices.map((index) => renderMarker(index))}

                {/* 右侧省略号 - 三个小圆点（间距与横条统一） */}
                {showRightEllipsis && (
                    <button
                        onClick={() => handleMarkerClick(totalPosts - 1)}
                        className={cn(
                            'flex items-center opacity-70 hover:opacity-90',
                            markerTransition
                        )}
                        style={{ gap: markerGap }}
                        aria-label="跳转到最后一篇文章"
                    >
                        <span className="bg-foreground/30 h-1 w-1 rounded-full" />
                        <span className="bg-foreground/30 h-1 w-1 rounded-full" />
                        <span className="bg-foreground/30 h-1 w-1 rounded-full" />
                    </button>
                )}
            </div>
        </div>
    );
}
