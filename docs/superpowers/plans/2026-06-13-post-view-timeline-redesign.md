# Post-View 时间线重设计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `PostViewPagination` 重写为「统一 marker · 离散 morph · 窗口化」的时间线——横杠⇄点是同一元素的两个形态端点,整数 activeIndex 切换时 CSS 过渡 morph,窗口化保证长度恒定,active 流光+呼吸。

**Architecture:** 所有几何计算抽到纯函数模块 `paginationGeometry.ts`(可单测);组件 `PostViewPagination.tsx` 只读 `postViewAtom`、调用纯函数拿布局、把结果绑到 DOM;持续动画与过渡放 CSS 模块 `post-view-timeline.css`(keyframes + `prefers-reduced-motion` 降级)。数据模型 `postViewAtom` 不变。

**Tech Stack:** React 19 + Jotai + TypeScript(strict, exactOptionalPropertyTypes)+ Tailwind v4 + CSS modules + Vitest(environment node)。

**Spec:** `docs/superpowers/specs/2026-06-13-post-view-timeline-redesign-design.md`

---

## File Structure

- **Create** `src/components/posts/view/paginationGeometry.ts` — 纯几何函数:`smoothstep`、`markerWidth`、`markerOpacity`、`computeTimelineLayout`、类型 `GeometryParams`/`MarkerLayout`/`TimelineLayout`、常量 `DEFAULT_GEOMETRY`。
- **Create** `src/components/posts/view/paginationGeometry.test.ts` — 上述纯函数的 Vitest 单测。
- **Create** `src/styles/modules/post-view-timeline.css` — `.pvp-track`/`.pvp-marker`/`.pvp-aura` 样式、`pvp-flow`/`pvp-breathe` keyframes、`prefers-reduced-motion` 降级。
- **Modify** `src/styles/modules/index.css` — `@import './post-view-timeline.css';`
- **Modify** `src/components/posts/view/PostViewPagination.tsx` — 整体重写(接口 `{ onScrollToPost, className }` 不变)。

参数取自 spec 第 5 节:barW 36 / dotW 6 / gap 16 / sharp 3.7 / K 3 / J 4 / trans 380ms(容器 420ms)。

---

## Task 1: 纯函数 — smoothstep + markerWidth

**Files:**

- Create: `src/components/posts/view/paginationGeometry.ts`
- Test: `src/components/posts/view/paginationGeometry.test.ts`

- [ ] **Step 1: Write the failing test**

创建 `src/components/posts/view/paginationGeometry.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { smoothstep, markerWidth, DEFAULT_GEOMETRY } from './paginationGeometry';

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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/posts/view/paginationGeometry.test.ts`
Expected: FAIL — `Failed to resolve import "./paginationGeometry"` (模块不存在)。

- [ ] **Step 3: Write minimal implementation**

创建 `src/components/posts/view/paginationGeometry.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/components/posts/view/paginationGeometry.test.ts`
Expected: PASS (7 tests)。

- [ ] **Step 5: Commit**

```bash
git add src/components/posts/view/paginationGeometry.ts src/components/posts/view/paginationGeometry.test.ts
git commit -m "feat(post-view): add timeline geometry — smoothstep + markerWidth"
```

---

## Task 2: 纯函数 — markerOpacity

**Files:**

- Modify: `src/components/posts/view/paginationGeometry.ts`
- Test: `src/components/posts/view/paginationGeometry.test.ts`

- [ ] **Step 1: Write the failing test**

在 `paginationGeometry.test.ts` 顶部 import 加上 `markerOpacity`:

```ts
import { smoothstep, markerWidth, markerOpacity, DEFAULT_GEOMETRY } from './paginationGeometry';
```

并在文件末尾追加:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/posts/view/paginationGeometry.test.ts`
Expected: FAIL — `markerOpacity is not a function` / import 解析失败。

- [ ] **Step 3: Write minimal implementation**

在 `paginationGeometry.ts` 末尾追加:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/components/posts/view/paginationGeometry.test.ts`
Expected: PASS (12 tests)。

- [ ] **Step 5: Commit**

```bash
git add src/components/posts/view/paginationGeometry.ts src/components/posts/view/paginationGeometry.test.ts
git commit -m "feat(post-view): add timeline geometry — markerOpacity"
```

---

## Task 3: 纯函数 — computeTimelineLayout(窗口化 + 居中)

**Files:**

- Modify: `src/components/posts/view/paginationGeometry.ts`
- Test: `src/components/posts/view/paginationGeometry.test.ts`

- [ ] **Step 1: Write the failing test**

在 `paginationGeometry.test.ts` 的 import 加上 `computeTimelineLayout`:

```ts
import {
    smoothstep,
    markerWidth,
    markerOpacity,
    computeTimelineLayout,
    DEFAULT_GEOMETRY,
} from './paginationGeometry';
```

文件末尾追加:

```ts
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
        // distance 8 from active -> outside window
        expect(markers[12]!.inWindow).toBe(false);
        expect(markers[12]!.width).toBe(0);
        // distance 7 -> window edge, still in window
        expect(markers[13]!.inWindow).toBe(true);
    });

    it('keeps total length constant regardless of post count (active centered)', () => {
        const small = computeTimelineLayout(15, 7, [7], p);
        const large = computeTimelineLayout(40, 20, [20], p);
        expect(sumSlotWidth(large)).toBeCloseTo(sumSlotWidth(small), 5);
    });

    it('centers the active marker (translateX ≈ 0 when symmetric)', () => {
        // active in the middle with full window on both sides -> already centered
        const { translateX } = computeTimelineLayout(15, 7, [7], p);
        expect(translateX).toBeCloseTo(0, 5);
    });

    it('shifts the track when active is at the start (no markers to its left)', () => {
        const { translateX, markers } = computeTimelineLayout(15, 0, [0], p);
        // left side has no markers -> track must move right to center active
        expect(translateX).toBeGreaterThan(0);
        // markers left of active do not exist; right side window present
        expect(markers[0]!.isActive).toBe(true);
    });

    it('flags visible indices as full opacity inside the window', () => {
        const { markers } = computeTimelineLayout(15, 7, [6, 7, 8], p);
        expect(markers[7]!.opacity).toBe(1);
        expect(markers[6]!.opacity).toBe(1);
        // index 5 is in window (d=2) but not visible -> dimmed
        expect(markers[5]!.opacity).toBeCloseTo(0.5, 5);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/posts/view/paginationGeometry.test.ts`
Expected: FAIL — `computeTimelineLayout is not a function`。

- [ ] **Step 3: Write minimal implementation**

在 `paginationGeometry.ts` 末尾追加:

```ts
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

    // 每个 marker 的占位 = width + (窗口内 ? gap : 0);窗口外贡献 0。
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/components/posts/view/paginationGeometry.test.ts`
Expected: PASS (18 tests)。

- [ ] **Step 5: Commit**

```bash
git add src/components/posts/view/paginationGeometry.ts src/components/posts/view/paginationGeometry.test.ts
git commit -m "feat(post-view): add timeline geometry — computeTimelineLayout (windowed + centered)"
```

---

## Task 4: 时间线样式模块(keyframes + marker + 降级)

**Files:**

- Create: `src/styles/modules/post-view-timeline.css`
- Modify: `src/styles/modules/index.css`

- [ ] **Step 1: Create the stylesheet**

创建 `src/styles/modules/post-view-timeline.css`:

```css
/**
 * post-view 时间线(PostViewPagination)样式。
 * 动态值(width / marginInline / opacity / translateX)由组件 inline style 设置;
 * 此处只放静态样式、过渡、keyframes 与降级。
 */

.pvp-track {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    will-change: transform;
    transition: transform 420ms cubic-bezier(0.22, 0.61, 0.36, 1);
}

.pvp-marker {
    flex: 0 0 auto;
    height: 6px;
    border: 0;
    padding: 0;
    border-radius: 999px;
    cursor: pointer;
    background: color-mix(in oklch, var(--foreground) 55%, transparent);
    transition:
        width 380ms cubic-bezier(0.22, 0.61, 0.36, 1),
        margin 380ms cubic-bezier(0.22, 0.61, 0.36, 1),
        opacity 380ms ease,
        background 380ms ease;
}

.pvp-marker:focus-visible {
    outline: 2px solid var(--toc-link-active, #6ee7ff);
    outline-offset: 3px;
}

.pvp-marker.is-active {
    background: linear-gradient(90deg, #ffd166, #6ee7ff, #8aa2ff, #6ee7ff, #ffd166);
    background-size: 200% 100%;
    box-shadow:
        0 0 10px rgb(110 231 255 / 0.45),
        0 0 20px rgb(138 162 255 / 0.28);
    animation:
        pvp-flow 3.2s linear infinite,
        pvp-breathe 2.4s ease-in-out infinite;
}

.pvp-aura {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 60%;
    height: 90px;
    transform: translate(-50%, -50%);
    pointer-events: none;
    border-radius: 999px;
    filter: blur(34px);
    opacity: 0.5;
    background: radial-gradient(
        ellipse at 50% 50%,
        rgb(110 231 255 / 0.16),
        rgb(138 162 255 / 0.1) 38%,
        rgb(255 209 102 / 0.045) 60%,
        transparent 78%
    );
    -webkit-mask-image: linear-gradient(90deg, transparent, #000 16%, #000 84%, transparent);
    mask-image: linear-gradient(90deg, transparent, #000 16%, #000 84%, transparent);
}

@keyframes pvp-flow {
    from {
        background-position: 0% 50%;
    }
    to {
        background-position: 200% 50%;
    }
}

@keyframes pvp-breathe {
    0%,
    100% {
        box-shadow:
            0 0 8px rgb(110 231 255 / 0.45),
            0 0 16px rgb(138 162 255 / 0.28);
    }
    50% {
        box-shadow:
            0 0 16px rgb(110 231 255 / 0.45),
            0 0 30px rgb(138 162 255 / 0.28);
    }
}

@media (prefers-reduced-motion: reduce) {
    .pvp-track,
    .pvp-marker {
        transition: none;
    }

    .pvp-marker.is-active {
        animation: none;
    }
}
```

- [ ] **Step 2: Import it from the modules entry**

修改 `src/styles/modules/index.css`,在末尾加一行:

```css
@import './post-view-timeline.css'; /* post-view 时间线 */
```

完整文件应为:

```css
/**
 * 组件样式模块入口
 * 包含所有可复用 UI 组件的样式规则
 */

@import './article/index.css'; /* 文章组件 */
@import './navbar.css'; /* 导航栏组件 */
@import './dock.css'; /* Dock 组件 */
@import './post-view-timeline.css'; /* post-view 时间线 */
```

- [ ] **Step 3: Verify the stylesheet compiles**

Run: `pnpm build`
Expected: 构建成功(85 page(s) built),无 CSS 解析报错。

- [ ] **Step 4: Commit**

```bash
git add src/styles/modules/post-view-timeline.css src/styles/modules/index.css
git commit -m "feat(post-view): add timeline stylesheet (morph transitions, flow/breathe, reduced-motion)"
```

---

## Task 5: 重写 PostViewPagination.tsx

**Files:**

- Modify: `src/components/posts/view/PostViewPagination.tsx`(整体替换)

接口不变:`PostViewScrollContainer.tsx:361` 调用 `<PostViewPagination onScrollToPost={scrollToPost} className={...} />`,本任务保持 props `{ onScrollToPost, className }`。

- [ ] **Step 1: Replace the component**

把 `src/components/posts/view/PostViewPagination.tsx` 全文替换为:

```tsx
import { useAtomValue } from 'jotai';
import { cn } from '@components/common/lib/utils';
import { postViewAtom } from '@stores/postViewAtom';
import { computeTimelineLayout, DEFAULT_GEOMETRY } from './paginationGeometry';

interface PostViewPaginationProps {
    /** 用于滚动到指定文章的回调函数 */
    onScrollToPost: (index: number) => void;
    className?: string;
}

export default function PostViewPagination({ onScrollToPost, className }: PostViewPaginationProps) {
    const { totalPosts, visibleIndices, activeIndex } = useAtomValue(postViewAtom);

    // 没有文章则不渲染
    if (totalPosts === 0) {
        return null;
    }

    const { markers, translateX } = computeTimelineLayout(
        totalPosts,
        activeIndex,
        visibleIndices,
        DEFAULT_GEOMETRY
    );

    return (
        <div
            className={cn(
                'post-view-pagination',
                'group relative flex h-6 w-full items-center justify-center overflow-visible pt-1 lg:h-auto',
                className
            )}
        >
            {/* 柔光底 */}
            <div className="pvp-aura" aria-hidden="true" />

            {/* marker 轨道:transform 使 active 居中 */}
            <div
                className="pvp-track"
                style={{ transform: `translateX(${translateX.toFixed(2)}px)` }}
            >
                {markers.map((marker, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={() => onScrollToPost(index)}
                        className={cn('pvp-marker', marker.isActive && 'is-active')}
                        style={{
                            width: `${marker.width.toFixed(2)}px`,
                            marginInline: `${marker.marginInline}px`,
                            opacity: marker.opacity.toFixed(3),
                            pointerEvents: marker.inWindow ? 'auto' : 'none',
                        }}
                        tabIndex={marker.inWindow ? 0 : -1}
                        aria-hidden={marker.inWindow ? undefined : true}
                        aria-current={marker.isActive ? 'true' : undefined}
                        aria-label={marker.isActive ? undefined : `跳转到第 ${index + 1} 篇文章`}
                    />
                ))}
            </div>
        </div>
    );
}
```

> 说明:`key={index}` 是稳定的(marker 与文章 index 一一对应,集合不重排),React 不会因此误复用。所有 marker 始终在 DOM,窗口外靠 width/margin/opacity → 0 收起,CSS 过渡负责 morph 连续性。

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: `0 errors`。
（若报 `exactOptionalPropertyTypes` 相关错误:确认 `aria-current`/`aria-label`/`aria-hidden` 用三元返回 `undefined` 而非传入显式 `undefined` 字段——上面的写法已符合,React 的 ARIA 属性类型接受 `T | undefined`。）

- [ ] **Step 3: Run the geometry tests + full unit suite**

Run: `pnpm test:run`
Expected: 全部 PASS(含新增 18 个几何测试,总数 = 原 174 + 18 = 192)。

- [ ] **Step 4: Lint**

Run: `pnpm lint`
Expected: 无输出(0 warning/error)。

- [ ] **Step 5: Commit**

```bash
git add src/components/posts/view/PostViewPagination.tsx
git commit -m "feat(post-view): rewrite pagination as unified-marker morph timeline"
```

---

## Task 6: 浏览器手动验证 + 全量检查

**Files:** 无代码改动(验证;如发现问题回到对应 Task 修复)。

- [ ] **Step 1: Build to confirm production output**

Run: `pnpm build`
Expected: 构建成功,85 page(s) built,无报错/警告。

- [ ] **Step 2: Start dev server**

Run: `pnpm dev`
Expected: `astro ... ready`,`http://localhost:4321/`。

- [ ] **Step 3: Manual checks on the real page**

打开 `http://localhost:4321/zh/post-view`(桌面宽度 ≥ 1024px,左下角才是 fixed 时间线),逐项确认:

- [ ] 横向滚动(滚轮/拖动):时间线跟随 activeIndex 离散切换,marker 在横杠⇄点之间 morph,整条丝滑平移
- [ ] 从第一篇滚到最后一篇:**整条长度恒定**,不随文章数变长;两端渐隐点表达"还有更多"
- [ ] 贴边(第一篇/最后一篇居中):active 贴边时该侧无多余渐隐点,布局自然
- [ ] active marker:黄青蓝渐变流光 + glow 呼吸
- [ ] 点击某个 marker:跳转到对应文章(`onScrollToPost`)
- [ ] 键盘:Tab 能聚焦窗口内 marker(focus-visible 描边),Enter/Space 触发跳转;窗口外 marker 不可聚焦
- [ ] DevTools 开启「Emulate prefers-reduced-motion: reduce」:流光/呼吸/morph 过渡停止,保留静态渐变高亮
- [ ] 暗色 / 亮色主题切换:marker 底色(`var(--foreground)` 混合)与 active 渐变都正常

- [ ] **Step 4: Final quality gate**

Run: `pnpm check`
Expected: `lint` + `format:check` + `typecheck` 全过(0 errors / 0 warnings)。

- [ ] **Step 5: Commit (if any fixes were made in Step 3)**

```bash
git add -A
git commit -m "fix(post-view): timeline polish from manual verification"
```

(无修复则跳过此步。)

---

## Self-Review(已核对)

- **Spec 覆盖**:统一 marker(Task 1/5)、离散 morph(Task 4 过渡 + Task 5)、窗口化长度恒定(Task 3 + Task 4 width:0 收起)、流光/呼吸(Task 4)、可见性明暗(Task 2/3 opacity)、reduced-motion(Task 4)、a11y(Task 5 tabIndex/pointer-events/aria)、纯函数加单测(Task 1-3)、参数表(Task 1 `DEFAULT_GEOMETRY`)、位置不变(Task 5 保留 `className` + 根 class)。✓
- **类型一致**:`GeometryParams`/`MarkerLayout`/`TimelineLayout`、`smoothstep`/`markerWidth`/`markerOpacity`/`computeTimelineLayout`/`DEFAULT_GEOMETRY` 在 Task 1-3 定义,Task 5 按同名同签名使用。✓
- **无 placeholder**:每个代码步骤含完整代码与确切命令/预期。✓
