import { describe, expect, it } from 'vitest';
import { createRemoteImageWidthPlan } from './responsiveImageWidths';

describe('createRemoteImageWidthPlan', () => {
    it('caps every stage at the remote source width', () => {
        expect(createRemoteImageWidthPlan([320, 480, 960, 1280], 300)).toEqual({
            low: 160,
            medium: 300,
            high: [300],
        });
    });

    it('keeps the original width as the largest high-stage candidate', () => {
        expect(createRemoteImageWidthPlan([320, 480, 960], 720)).toEqual({
            low: 160,
            medium: 480,
            high: [320, 480, 720],
        });
    });

    it('sorts, rounds, and deduplicates valid requested widths', () => {
        expect(createRemoteImageWidthPlan([960, 320.4, 320, 0, -1, Number.NaN], 800)).toEqual({
            low: 160,
            medium: 480,
            high: [320, 800],
        });
    });

    it('does not upscale low or medium stages for a tiny original', () => {
        expect(createRemoteImageWidthPlan([], 96)).toEqual({
            low: 96,
            medium: 96,
            high: [96],
        });
    });
});
