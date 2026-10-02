import { describe, expect, it } from 'vitest';
import {
    classifyHorizontalWheel,
    registerPageWheelIntent,
    type PageWheelBurstState,
} from './horizontalWheel';

describe('classifyHorizontalWheel', () => {
    it('leaves a precise horizontal gesture to native overflow scrolling', () => {
        expect(classifyHorizontalWheel({ deltaX: 18, deltaY: 3 })).toEqual({
            kind: 'native',
            direction: 1,
        });
    });

    it('turns a vertical wheel into a single page direction', () => {
        expect(classifyHorizontalWheel({ deltaX: 0, deltaY: -120 })).toEqual({
            kind: 'page',
            direction: -1,
        });
    });

    it('preserves the direction of a native horizontal gesture', () => {
        expect(classifyHorizontalWheel({ deltaX: -4, deltaY: 1 })).toEqual({
            kind: 'native',
            direction: -1,
        });
    });

    it('ignores zero and non-finite dominant deltas', () => {
        expect(classifyHorizontalWheel({ deltaX: 0, deltaY: 0 })).toEqual({ kind: 'none' });
        expect(classifyHorizontalWheel({ deltaX: Number.NaN, deltaY: 0 })).toEqual({
            kind: 'none',
        });
    });
});

describe('registerPageWheelIntent', () => {
    it('coalesces a short burst and permits a new step after a quiet window', () => {
        const first = registerPageWheelIntent(null, 1, 100);
        expect(first.shouldPage).toBe(true);
        const repeated = registerPageWheelIntent(first.state, 1, 150);
        expect(repeated.shouldPage).toBe(false);
        expect(registerPageWheelIntent(repeated.state, 1, 329).shouldPage).toBe(false);
        expect(registerPageWheelIntent(repeated.state, 1, 330).shouldPage).toBe(true);
    });

    it('keeps sustained input moving without allowing every wheel event to page', () => {
        let state: PageWheelBurstState | null = null;
        const pageTimes: number[] = [];
        for (let now = 0; now <= 3000; now += 100) {
            const decision = registerPageWheelIntent(state, 1, now);
            state = decision.state;
            if (decision.shouldPage) pageTimes.push(now);
        }
        expect(pageTimes).toEqual([0, 400, 800, 1200, 1600, 2000, 2400, 2800]);
    });

    it('responds immediately to a direction reversal and coalesces its follow-up events', () => {
        const forward = registerPageWheelIntent(null, 1, 100);
        const reverse = registerPageWheelIntent(forward.state, -1, 120);
        expect(reverse.shouldPage).toBe(true);
        expect(registerPageWheelIntent(reverse.state, -1, 140).shouldPage).toBe(false);
    });
});
