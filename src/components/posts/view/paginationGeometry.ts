/**
 * post-view 时间线的纯几何计算(无 DOM 依赖,可单测)。
 * 设计见 docs/superpowers/specs/2026-06-13-post-view-timeline-redesign-design.md
 */

export interface GeometryParams {
    /** 近端横杠最大宽度(px,distance=0 时) */
    barW: number;
    /** 远端收缩点宽度(px) */
    dotW: number;
    /** marker 间距(px),marginInline = gap / 2;由 computeTimelineLayout(Task 3)消费 */
    gap: number;
    /** 横杠收成点(width)的完成距离 = smoothstep(0, sharp, d) 的上界;只决定 width 形态,与 K/J 无关 */
    sharp: number;
    /** 窗口「核心区」半径:此范围内的 marker 透明度保持 base、不因距离渐隐(width 仍由 sharp 控制,K 不代表完整宽度) */
    K: number;
    /** 核心区之外到窗口边缘的渐隐区宽度;窗口半径 R = K + J,|distance| > R 的 marker 完全收起(width/opacity → 0) */
    J: number;
}

export const DEFAULT_GEOMETRY: GeometryParams = {
    barW: 36,
    dotW: 6,
    gap: 16,
    sharp: 3.7,
    K: 3,
    J: 4,
};

/** 平滑插值因子,x 在 [edge0, edge1] 外被钳制到 0/1。 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
    if (edge0 === edge1) return x < edge0 ? 0 : 1;
    const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * 距 active 的距离 -> marker 宽度。
 * 窗口外(|distance| > K + J)宽度为 0,即完全收起、不占位 → 整条长度恒定。
 */
export function markerWidth(distance: number, p: GeometryParams): number {
    const d = Math.abs(distance);
    if (d > p.K + p.J) return 0;
    return lerp(p.barW, p.dotW, smoothstep(0, p.sharp, d));
}

/**
 * 距 active 的距离 -> 透明度。
 * 窗口外=0;d<=K 取 base(visible?1:0.5);K<d<=R 在 base 上按 smoothstep 渐隐到 0(表示"还有更多")。
 */
export function markerOpacity(
    distance: number,
    opts: { visible: boolean; K: number; J: number }
): number {
    const d = Math.abs(distance);
    const r = opts.K + opts.J;
    if (d > r) return 0;
    const base = opts.visible ? 1 : 0.5;
    if (d <= opts.K) return base;
    return base * (1 - smoothstep(opts.K, r, d));
}

export interface MarkerLayout {
    /** 宽度(px),窗口外为 0 */
    width: number;
    /** 单侧外边距(px),窗口外为 0 */
    marginInline: number;
    /** 透明度 [0,1] */
    opacity: number;
    /** 是否在窗口内(决定是否占位 / 可聚焦) */
    inWindow: boolean;
    /** 是否当前活动项 */
    isActive: boolean;
}

export interface TimelineLayout {
    markers: MarkerLayout[];
    /** tl 容器的水平偏移,使 active marker 居中 */
    translateX: number;
}

export interface CompositedMarkerLayout {
    /** 固定宽度 marker 的横向缩放；只触发合成，不改变 flex 几何。 */
    scaleX: number;
    opacity: number;
    inWindow: boolean;
    isActive: boolean;
}

export interface CompositedTimelineLayout {
    markers: CompositedMarkerLayout[];
    /** 固定 slot 轨道的位移；消费方通过 translate3d 应用。 */
    translateX: number;
}

/**
 * 生成不修改 width/left 的时间线布局。
 * 每个 marker 始终占据 barW + gap 的固定 slot，视觉宽度只用 scaleX 表达；
 * 轨道以 left:50% 为原点，因此位移需要把活动 slot 的中心拉回原点。
 */
export function computeCompositedTimelineLayout(
    total: number,
    activeIndex: number,
    visibleIndices: number[],
    p: GeometryParams
): CompositedTimelineLayout {
    if (total <= 0) return { markers: [], translateX: 0 };

    const clampedActiveIndex = Math.min(Math.max(activeIndex, 0), total - 1);
    const r = p.K + p.J;
    const visible = new Set(visibleIndices);
    const markers: CompositedMarkerLayout[] = [];

    for (let index = 0; index < total; index += 1) {
        const distance = Math.abs(index - clampedActiveIndex);
        const inWindow = distance <= r;
        markers.push({
            scaleX: markerWidth(distance, p) / p.barW,
            opacity: markerOpacity(distance, {
                visible: visible.has(index),
                K: p.K,
                J: p.J,
            }),
            inWindow,
            isActive: index === clampedActiveIndex,
        });
    }

    const slotWidth = p.barW + p.gap;
    return {
        markers,
        translateX: -(clampedActiveIndex * slotWidth + slotWidth / 2),
    };
}

/**
 * 滚动进度 [0,1]:scrollLeft / (scrollWidth − clientWidth),夹紧到 [0,1]。
 * 内容未超出视口(不可滚)时返回 0。用于底边总览进度条的填充比例。
 */
export function computeScrollProgress(
    scrollLeft: number,
    scrollWidth: number,
    clientWidth: number
): number {
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0) return 0;
    return Math.min(Math.max(scrollLeft / maxScroll, 0), 1);
}

/**
 * 计算整条时间线布局。窗口外 marker width/margin 为 0(不占位),故长度恒定。
 * translateX 让 active marker 的中心落在内容总宽的中点。
 */
export function computeTimelineLayout(
    total: number,
    activeIndex: number,
    visibleIndices: number[],
    p: GeometryParams
): TimelineLayout {
    const r = p.K + p.J;
    const visible = new Set(visibleIndices);
    const markers: MarkerLayout[] = [];

    for (let i = 0; i < total; i += 1) {
        const d = Math.abs(i - activeIndex);
        const inWindow = d <= r;
        markers.push({
            width: markerWidth(d, p),
            marginInline: inWindow ? p.gap / 2 : 0,
            opacity: markerOpacity(d, { visible: visible.has(i), K: p.K, J: p.J }),
            inWindow,
            isActive: i === activeIndex,
        });
    }

    const slot = (m: MarkerLayout): number => m.width + (m.inWindow ? p.gap : 0);
    const totalWidth = markers.reduce((acc, m) => acc + slot(m), 0);

    let offsetToActiveCenter = 0;
    for (let i = 0; i < activeIndex; i += 1) {
        offsetToActiveCenter += slot(markers[i]!);
    }
    const activeMarker = markers[activeIndex];
    if (activeMarker) {
        offsetToActiveCenter += (activeMarker.inWindow ? p.gap / 2 : 0) + activeMarker.width / 2;
    }

    return { markers, translateX: totalWidth / 2 - offsetToActiveCenter };
}
