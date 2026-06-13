import { useAtomValue } from 'jotai';
import { cn } from '@components/common/lib/utils';
import { postViewAtom } from '@stores/postViewAtom';
import {
    computeTimelineLayout,
    computeMinimapWindow,
    DEFAULT_GEOMETRY,
} from './paginationGeometry';

interface PostViewPaginationProps {
    /** 用于滚动到指定文章的回调函数 */
    onScrollToPost: (index: number) => void;
    className?: string;
}

export default function PostViewPagination({ onScrollToPost, className }: PostViewPaginationProps) {
    const { totalPosts, visibleIndices, activeIndex } = useAtomValue(postViewAtom);

    // 没有文章则不渲染
    if (totalPosts === 0) {
        return null;
    }

    const { markers, translateX } = computeTimelineLayout(
        totalPosts,
        activeIndex,
        visibleIndices,
        DEFAULT_GEOMETRY
    );
    const minimap = computeMinimapWindow(visibleIndices, totalPosts);

    // sr-only 进度文本:当前可见范围(无可见项时退化为 active 篇)
    const firstVisible = visibleIndices.length > 0 ? Math.min(...visibleIndices) : activeIndex;
    const lastVisible = visibleIndices.length > 0 ? Math.max(...visibleIndices) : activeIndex;

    return (
        <div
            className={cn(
                'post-view-pagination',
                'pvp-cluster group relative w-full overflow-visible pt-1 lg:h-auto',
                className
            )}
        >
            <span className="sr-only">
                {`正在浏览第 ${firstVisible + 1} 到 ${lastVisible + 1} 篇,共 ${totalPosts} 篇`}
            </span>

            {/* 时间线(主):aura 柔光底 + marker 轨道 */}
            <div className="pvp-timeline">
                <div className="pvp-aura" aria-hidden="true" />
                <div
                    className="pvp-track"
                    style={{ transform: `translateX(${translateX.toFixed(2)}px)` }}
                >
                    {markers.map((marker, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => onScrollToPost(index)}
                            className={cn('pvp-marker', marker.isActive && 'is-active')}
                            style={{
                                width: `${marker.width.toFixed(2)}px`,
                                marginInline: `${marker.marginInline}px`,
                                opacity: marker.opacity.toFixed(3),
                                pointerEvents: marker.inWindow ? 'auto' : 'none',
                            }}
                            tabIndex={marker.inWindow ? 0 : -1}
                            aria-hidden={marker.inWindow ? undefined : true}
                            aria-current={marker.isActive ? 'true' : undefined}
                            aria-label={
                                marker.isActive ? undefined : `跳转到第 ${index + 1} 篇文章`
                            }
                        />
                    ))}
                </div>
            </div>

            {/* minimap 总览底条(辅):当前可见窗口在整体里的位置 + 占比 */}
            <div className="pvp-minimap" aria-hidden="true">
                <div
                    className="pvp-minimap-window"
                    style={{
                        left: `${minimap.left.toFixed(2)}%`,
                        width: `${minimap.width.toFixed(2)}%`,
                    }}
                />
            </div>
        </div>
    );
}
