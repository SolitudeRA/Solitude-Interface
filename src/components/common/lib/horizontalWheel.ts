export type HorizontalWheelIntent =
    | { kind: 'none' }
    | { kind: 'native'; direction: -1 | 1 }
    | { kind: 'page'; direction: -1 | 1 };

export interface PageWheelBurstDecision {
    shouldPage: boolean;
    lockedUntil: number;
}

interface WheelDeltaInput {
    deltaX: number;
    deltaY: number;
}

/**
 * Treats consecutive page-style wheel intents as one burst. Every intent extends the lock, so a
 * new page step is allowed only after the full quiet window has elapsed since the previous intent.
 */
export function registerPageWheelIntent(
    lockedUntil: number,
    now: number,
    quietWindow: number
): PageWheelBurstDecision {
    return {
        shouldPage: now >= lockedUntil,
        lockedUntil: now + quietWindow,
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
