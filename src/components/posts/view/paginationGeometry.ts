/**
 * post-view 时间线的纯几何计算(无 DOM 依赖,可单测)。
 * 设计见 docs/superpowers/specs/2026-06-13-post-view-timeline-redesign-design.md
 */

export interface GeometryParams {
    /** 近端横杠最大宽度(px) */
    barW: number;
    /** 远端收缩点宽度(px) */
    dotW: number;
    /** marker 间距(px),marginInline = gap / 2 */
    gap: number;
    /** smoothstep 上界,控制横杠收成点的快慢 */
    sharp: number;
    /** active 每侧完整 marker 半径 */
    K: number;
    /** 再外侧渐隐点数量(窗口半径 R = K + J) */
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
