import { useAtomValue } from 'jotai';
import { cn } from '@components/common/lib/utils';
import { postViewAtom } from '@stores/postViewAtom';
import { computeTimelineLayout, DEFAULT_GEOMETRY } from './paginationGeometry';

interface PostViewPaginationProps {
    /** 用于滚动到指定文章的回调函数 */
    onScrollToPost: (index: number) => void;
    className?: string;
}

/** 补零到至少两位(总数 ≥ 100 时自然显示三位) */
const pad2 = (n: number): string => String(n).padStart(2, '0');

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
                'pvp-cluster group relative h-6 w-full overflow-visible pt-1 lg:h-auto',
                className
            )}
        >
            {/* 进度数字(视觉);屏幕阅读器用下方 sr-only 文本 */}
            <div className="pvp-num" aria-hidden="true">
                <span className="pvp-num-cur">{pad2(activeIndex + 1)}</span>
                <span className="pvp-num-sep">/</span>
                <span className="pvp-num-total">{pad2(totalPosts)}</span>
            </div>
            <span className="sr-only">{`第 ${activeIndex + 1} 篇,共 ${totalPosts} 篇`}</span>

            {/* 时间线:aura 柔光底 + marker 轨道 */}
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
        </div>
    );
}
