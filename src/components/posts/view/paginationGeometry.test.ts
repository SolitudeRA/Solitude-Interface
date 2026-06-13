import { describe, it, expect } from 'vitest';
import { smoothstep, markerWidth, markerOpacity, DEFAULT_GEOMETRY } from './paginationGeometry';

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
