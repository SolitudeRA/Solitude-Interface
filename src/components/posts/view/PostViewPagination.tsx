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

export default function PostViewPagination({
    onScrollToPost,
    className,
}: PostViewPaginationProps) {
    const postViewState = useAtomValue(postViewAtom);
    const { totalPosts, visibleIndices, activeIndex } = postViewState;

    const handleMarkerClick = useCallback(
        (index: number) => {
            onScrollToPost(index);
        },
        [onScrollToPost],
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

    // Q弹动画曲线
    const bounceTransition =
        'transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]';

    // 判断是否是首尾文章（显示圆圈）
    const isEndpoint = (index: number) =>
        index === 0 || index === totalPosts - 1;

    // 判断是否可见
    const isIndexVisible = (index: number) => visibleIndices.includes(index);

    // 计算要显示的索引范围（以 activeIndex 为中心）
    const leftCount = Math.min(activeIndex, MAX_OUTSIDE_MARKERS);
    const rightCount = Math.min(
        totalPosts - 1 - activeIndex,
        MAX_OUTSIDE_MARKERS,
    );

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
    // 每个 marker 的宽度 + 间距
    const markerTotalWidth = markerWidth + markerGap;
    const totalDisplayCount = displayIndices.length;

    // 计算需要偏移的像素数
    // 中心位置 = (totalDisplayCount - 1) / 2
    // 当前位置 = activePositionInDisplay
    // 偏移量 = (中心位置 - 当前位置) * markerTotalWidth
    const centerPosition = (totalDisplayCount - 1) / 2;
    const offsetX =
        (centerPosition - activePositionInDisplay) * markerTotalWidth;

    // 计算横条宽度（宽度渐变效果）：距离 activeIndex 越近越宽
    const getMarkerWidth = (index: number): number => {
        const distance = Math.abs(index - activeIndex);
        // 宽度配置：中心 40px，相邻 28px，再远 20px，最远 14px（对比更明显）
        if (distance === 0) return 40;
        if (distance === 1) return 28;
        if (distance === 2) return 20;
        return 14;
    };

    // 渲染单个 marker（横杠或圆圈）
    const renderMarker = (index: number) => {
        const isCircle = isEndpoint(index);
        const isVisible = isIndexVisible(index);
        const dynamicWidth = getMarkerWidth(index);

        const baseClasses = cn(
            'rounded-full',
            bounceTransition,
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            isVisible
                ? 'bg-foreground/90 hover:opacity-80'
                : 'bg-foreground/25 hover:bg-foreground/40 hover:scale-110',
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
                        bounceTransition,
                        'focus-visible:ring-ring focus:outline-none focus-visible:ring-2',
                        'bg-transparent',
                        isVisible
                            ? 'border-foreground/90 hover:opacity-80'
                            : 'border-foreground/25 hover:border-foreground/40 hover:scale-110',
                    )}
                    style={{
                        width: dynamicCircleSize,
                        height: dynamicCircleSize,
                        borderWidth: 4,
                    }}
                    aria-label={
                        index === 0 ? '跳转到第一篇文章' : '跳转到最后一篇文章'
                    }
                />
            );
        }

        // 横杠样式 - 宽度渐变效果
        return (
            <button
                key={`marker-${index}`}
                onClick={() => handleMarkerClick(index)}
                className={cn(baseClasses, 'h-1')}
                style={{ width: dynamicWidth }}
                aria-label={`跳转到第 ${index + 1} 篇文章`}
            />
        );
    };

    return (
        <div
            className={cn(
                'post-view-pagination',
                'flex items-center justify-center',
                'w-full pt-1',
                className,
            )}
        >
            {/* 整体容器，使用 transform 偏移使 activeIndex 居中 */}
            <div
                className={cn(
                    'flex items-center justify-center',
                    bounceTransition,
                )}
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
                            'flex items-center hover:opacity-80',
                            bounceTransition,
                        )}
                        style={{ gap: markerGap }}
                        aria-label="跳转到第一篇文章"
                    >
                        <span className="bg-foreground/40 h-1 w-1 rounded-full" />
                        <span className="bg-foreground/40 h-1 w-1 rounded-full" />
                        <span className="bg-foreground/40 h-1 w-1 rounded-full" />
                    </button>
                )}

                {/* 所有显示的 markers */}
                {displayIndices.map((index) => renderMarker(index))}

                {/* 右侧省略号 - 三个小圆点（间距与横条统一） */}
                {showRightEllipsis && (
                    <button
                        onClick={() => handleMarkerClick(totalPosts - 1)}
                        className={cn(
                            'flex items-center hover:opacity-80',
                            bounceTransition,
                        )}
                        style={{ gap: markerGap }}
                        aria-label="跳转到最后一篇文章"
                    >
                        <span className="bg-foreground/40 h-1 w-1 rounded-full" />
                        <span className="bg-foreground/40 h-1 w-1 rounded-full" />
                        <span className="bg-foreground/40 h-1 w-1 rounded-full" />
                    </button>
                )}
            </div>
        </div>
    );
}
