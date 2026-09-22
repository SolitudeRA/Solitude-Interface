import { describe, expect, it } from 'vitest';
import { classifyHorizontalWheel, registerPageWheelIntent } from './horizontalWheel';

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
    it('extends the burst lock until the last page intent has been quiet long enough', () => {
        const first = registerPageWheelIntent(0, 100, 180);
        expect(first).toEqual({ shouldPage: true, lockedUntil: 280 });

        const sustained = registerPageWheelIntent(first.lockedUntil, 250, 180);
        expect(sustained).toEqual({ shouldPage: false, lockedUntil: 430 });

        const stillSustained = registerPageWheelIntent(sustained.lockedUntil, 420, 180);
        expect(stillSustained).toEqual({ shouldPage: false, lockedUntil: 600 });

        expect(registerPageWheelIntent(stillSustained.lockedUntil, 600, 180)).toEqual({
            shouldPage: true,
            lockedUntil: 780,
        });
    });
});
