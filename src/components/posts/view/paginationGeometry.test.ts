import { describe, it, expect } from 'vitest';
import {
    smoothstep,
    markerWidth,
    markerOpacity,
    DEFAULT_GEOMETRY,
    DEFAULT_MINIMAP_MAX_WIDTH,
    computeTimelineLayout,
    computeMinimapWindow,
} from './paginationGeometry';

describe('smoothstep', () => {
    it('clamps below edge0 to 0 and above edge1 to 1', () => {
        expect(smoothstep(0, 4, -1)).toBe(0);
        expect(smoothstep(0, 4, 5)).toBe(1);
    });

    it('returns 0.5 at the midpoint', () => {
        expect(smoothstep(0, 4, 2)).toBeCloseTo(0.5, 5);
    });

    it('handles a zero-width range without NaN', () => {
        expect(smoothstep(3, 3, 2)).toBe(0);
        expect(smoothstep(3, 3, 3)).toBe(1);
    });

    it('returns 1 exactly at edge1', () => {
        expect(smoothstep(0, 4, 4)).toBe(1);
    });
});

describe('markerWidth', () => {
    const p = DEFAULT_GEOMETRY; // barW 36, dotW 6, sharp 3.7, K 3, J 4 (R = 7)

    it('is the full bar width at the active marker (distance 0)', () => {
        expect(markerWidth(0, p)).toBeCloseTo(36, 5);
    });

    it('collapses to 0 outside the window (distance > K + J)', () => {
        expect(markerWidth(8, p)).toBe(0);
    });

    it('is the dot width at the window edge (distance = K + J)', () => {
        // smoothstep(0, 3.7, 7) === 1 -> lerp(36, 6, 1) === 6
        expect(markerWidth(7, p)).toBeCloseTo(6, 5);
    });

    it('is symmetric for negative distances', () => {
        expect(markerWidth(-2, p)).toBeCloseTo(markerWidth(2, p), 5);
    });

    it('threads custom params through (not module constants)', () => {
        const custom = { barW: 10, dotW: 2, gap: 8, sharp: 2, K: 1, J: 2 };
        expect(markerWidth(0, custom)).toBeCloseTo(10, 5); // barW
        expect(markerWidth(2, custom)).toBeCloseTo(2, 5); // smoothstep(0,2,2)=1 -> dotW
        expect(markerWidth(4, custom)).toBe(0); // > K+J = 3
    });
});

describe('markerOpacity', () => {
    const o = { K: 3, J: 4 }; // R = 7

    it('is fully opaque for a visible marker inside the bar region (d <= K)', () => {
        expect(markerOpacity(0, { visible: true, ...o })).toBe(1);
        expect(markerOpacity(3, { visible: true, ...o })).toBe(1);
    });

    it('is dimmed (0.5) for a non-visible marker inside the bar region', () => {
        expect(markerOpacity(2, { visible: false, ...o })).toBeCloseTo(0.5, 5);
    });

    it('fades to 0 at the window edge (d = R)', () => {
        expect(markerOpacity(7, { visible: true, ...o })).toBeCloseTo(0, 5);
    });

    it('is 0 outside the window (d > R)', () => {
        expect(markerOpacity(8, { visible: true, ...o })).toBe(0);
    });

    it('partially fades outer dots (K < d < R)', () => {
        // smoothstep(3, 7, 5) === 0.5 -> 1 * (1 - 0.5) === 0.5
        expect(markerOpacity(5, { visible: true, ...o })).toBeCloseTo(0.5, 5);
    });
});

describe('computeTimelineLayout', () => {
    const p = DEFAULT_GEOMETRY; // gap 16, K 3, J 4 (R = 7)
    const sumSlotWidth = (layout: ReturnType<typeof computeTimelineLayout>) =>
        layout.markers.reduce((acc, m) => acc + m.width + (m.inWindow ? p.gap : 0), 0);

    it('marks exactly one active marker', () => {
        const { markers } = computeTimelineLayout(15, 7, [7], p);
        expect(markers.filter((m) => m.isActive)).toHaveLength(1);
        expect(markers[7]!.isActive).toBe(true);
    });

    it('collapses markers outside the window to width 0 and not in window', () => {
        const { markers } = computeTimelineLayout(40, 20, [20], p);
        expect(markers[12]!.inWindow).toBe(false);
        expect(markers[12]!.width).toBe(0);
        expect(markers[13]!.inWindow).toBe(true);
    });

    it('keeps total length constant regardless of post count (active centered)', () => {
        const small = computeTimelineLayout(15, 7, [7], p);
        const large = computeTimelineLayout(40, 20, [20], p);
        expect(sumSlotWidth(large)).toBeCloseTo(sumSlotWidth(small), 5);
    });

    it('centers the active marker (translateX ≈ 0 when symmetric)', () => {
        const { translateX } = computeTimelineLayout(15, 7, [7], p);
        expect(translateX).toBeCloseTo(0, 5);
    });

    it('shifts the track when active is at the start (no markers to its left)', () => {
        const { translateX, markers } = computeTimelineLayout(15, 0, [0], p);
        expect(translateX).toBeGreaterThan(0);
        expect(markers[0]!.isActive).toBe(true);
    });

    it('flags visible indices as full opacity inside the window', () => {
        const { markers } = computeTimelineLayout(15, 7, [6, 7, 8], p);
        expect(markers[7]!.opacity).toBe(1);
        expect(markers[6]!.opacity).toBe(1);
        expect(markers[5]!.opacity).toBeCloseTo(0.5, 5);
    });
});

describe('computeMinimapWindow (scrollbar thumb)', () => {
    it('returns a zero window when there is no scrollable content', () => {
        expect(computeMinimapWindow(0, 0, 0)).toEqual({ left: 0, width: 0 });
        expect(computeMinimapWindow(0, 0, 500)).toEqual({ left: 0, width: 0 });
        expect(computeMinimapWindow(0, 1000, 0)).toEqual({ left: 0, width: 0 });
    });

    it('fills the whole track when content fits the viewport', () => {
        expect(computeMinimapWindow(0, 800, 800)).toEqual({ left: 0, width: 100 });
        expect(computeMinimapWindow(0, 800, 1000)).toEqual({ left: 0, width: 100 });
    });

    // 传 100 关闭封顶,单独验证“真实比例 + 进度定位”那部分逻辑
    const NO_CAP = 100;

    it('sizes the thumb by viewport / content ratio, stable across scroll positions', () => {
        // 视口占内容一半 -> 50% 宽,且不随 scrollLeft 改变(解决“长度拖动”)
        expect(computeMinimapWindow(0, 1000, 500, NO_CAP).width).toBe(50);
        expect(computeMinimapWindow(250, 1000, 500, NO_CAP).width).toBe(50);
        expect(computeMinimapWindow(500, 1000, 500, NO_CAP).width).toBe(50);
    });

    it('positions the thumb by scroll progress', () => {
        expect(computeMinimapWindow(0, 1000, 500, NO_CAP)).toEqual({ left: 0, width: 50 });
        expect(computeMinimapWindow(250, 1000, 500, NO_CAP)).toEqual({ left: 25, width: 50 });
    });

    it('keeps the thumb flush to the right edge at max scroll (left + width = 100)', () => {
        const w = computeMinimapWindow(500, 1000, 500, NO_CAP); // maxScroll = 1000 - 500
        expect(w).toEqual({ left: 50, width: 50 });
        expect(w.left + w.width).toBe(100);
    });

    it('clamps overscroll so the thumb never leaves the track', () => {
        // 负向回弹
        expect(computeMinimapWindow(-80, 1000, 500, NO_CAP).left).toBe(0);
        // 超过最大滚动(rubber-band)
        const over = computeMinimapWindow(900, 1000, 500, NO_CAP); // progress 夹到 1
        expect(over.left).toBe(50);
        expect(over.left + over.width).toBe(100);
    });

    it('produces a short thumb for long content', () => {
        // 视口占内容 1/5 -> 20% 宽(内容越多,滑块越短)
        expect(computeMinimapWindow(0, 2500, 500, NO_CAP).width).toBe(20);
    });

    it('caps the thumb width so few-post collections stay compact', () => {
        // 真实比例 50% 高于上限 -> 收到上限(默认封顶)
        expect(computeMinimapWindow(0, 1000, 500).width).toBe(DEFAULT_MINIMAP_MAX_WIDTH);
    });

    it('leaves the thumb uncapped when the true ratio is already below the cap', () => {
        // 真实比例 20% < 上限 -> 保持真实比例
        expect(computeMinimapWindow(0, 2500, 500).width).toBe(20);
    });

    it('still reaches the right edge at max scroll when capped (left + width = 100)', () => {
        // 封顶后滑块更窄,但按进度映射满行程,末端仍贴右缘
        const w = computeMinimapWindow(500, 1000, 500); // 默认封顶,progress = 1
        expect(w.width).toBe(DEFAULT_MINIMAP_MAX_WIDTH);
        expect(w.left).toBe(100 - DEFAULT_MINIMAP_MAX_WIDTH);
        expect(w.left + w.width).toBe(100);
    });
});
