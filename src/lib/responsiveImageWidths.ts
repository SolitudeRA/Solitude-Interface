export interface RemoteImageWidthPlan {
    low: number;
    medium: number;
    high: number[];
}

function normalizeWidth(width: number): number | null {
    if (!Number.isFinite(width) || width <= 0) return null;
    return Math.max(1, Math.round(width));
}

/**
 * Builds the progressive width plan without ever requesting a remote rendition wider than the
 * source. The source width is always retained as the largest high-stage candidate so large-but-
 * narrower originals do not lose their best available rendition.
 */
export function createRemoteImageWidthPlan(
    requestedWidths: readonly number[],
    sourceWidth: number
): RemoteImageWidthPlan {
    const normalizedSourceWidth = normalizeWidth(sourceWidth) ?? 1;
    const high = Array.from(
        new Set([
            ...requestedWidths
                .map(normalizeWidth)
                .filter((width): width is number => width !== null)
                .map((width) => Math.min(width, normalizedSourceWidth)),
            normalizedSourceWidth,
        ])
    ).sort((left, right) => left - right);

    return {
        low: Math.min(160, normalizedSourceWidth),
        medium: Math.min(480, normalizedSourceWidth),
        high,
    };
}
