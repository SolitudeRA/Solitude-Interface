import { useAtomValue } from 'jotai';
import { cn } from '@components/common/lib/utils';
import { postViewAtom } from '@stores/postViewAtom';
import { computeTimelineLayout, DEFAULT_GEOMETRY } from './paginationGeometry';

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

    return (
        <div
            className={cn(
                'post-view-pagination',
                'group relative flex h-6 w-full items-center justify-center overflow-visible pt-1 lg:h-auto',
                className
            )}
        >
            {/* 柔光底 */}
            <div className="pvp-aura" aria-hidden="true" />

            {/* marker 轨道:transform 使 active 居中 */}
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
                        aria-label={marker.isActive ? undefined : `跳转到第 ${index + 1} 篇文章`}
                    />
                ))}
            </div>
        </div>
    );
}
