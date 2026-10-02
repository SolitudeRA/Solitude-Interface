export type HorizontalWheelIntent =
    | { kind: 'none' }
    | { kind: 'native'; direction: -1 | 1 }
    | { kind: 'page'; direction: -1 | 1 };

export interface PageWheelBurstDecision {
    shouldPage: boolean;
    state: PageWheelBurstState;
}

export interface PageWheelBurstState {
    direction: -1 | 1;
    lastIntentAt: number;
    lastPageAt: number;
}

interface WheelDeltaInput {
    deltaX: number;
    deltaY: number;
}

/**
 * Coalesce a short wheel burst, but let sustained input keep advancing at a bounded cadence.
 * Reversing direction expresses a new intent and must not wait for the previous burst to settle.
 */
export function registerPageWheelIntent(
    previous: PageWheelBurstState | null,
    direction: -1 | 1,
    now: number,
    quietWindow = 180,
    maxHold = 400
): PageWheelBurstDecision {
    const shouldPage =
        previous === null ||
        previous.direction !== direction ||
        now - previous.lastIntentAt >= quietWindow ||
        now - previous.lastPageAt >= maxHold;

    return {
        shouldPage,
        state: {
            direction,
            lastIntentAt: now,
            lastPageAt: shouldPage ? now : previous!.lastPageAt,
        },
    };
}

/**
 * 水平手势交给浏览器原生 overflow 滚动；以垂直轴为主的滚轮输入只表达一次分页方向。
 * burst 锁由消费方负责，这里保持为可测试的纯分类。
 */
export function classifyHorizontalWheel({
    deltaX,
    deltaY,
}: WheelDeltaInput): HorizontalWheelIntent {
    const horizontal = Math.abs(deltaX) > Math.abs(deltaY);
    const dominantDelta = horizontal ? deltaX : deltaY;
    if (!Number.isFinite(dominantDelta) || dominantDelta === 0) return { kind: 'none' };

    const direction = dominantDelta > 0 ? 1 : -1;
    if (!horizontal) return { kind: 'page', direction };

    return { kind: 'native', direction };
}
