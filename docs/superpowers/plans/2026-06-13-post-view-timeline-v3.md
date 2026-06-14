# Post-View 时间线 v3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把时间线的进度数字 + 切换 pop 换成一条 minimap 总览底条,布局改为垂直叠放(时间线在上、minimap 在下)。

**Architecture:** 新增纯函数 `computeMinimapWindow`(可单测)算高亮段的 left/width 占比;组件移除数字与 pop、改叠放、渲染 minimap;CSS 移除 `.pvp-num*`/`pvp-pop`、加 minimap 样式、cluster 改 column。时间线本体几何/动效/数据模型不变。

**Tech Stack:** React 19 + Jotai + TypeScript(strict)+ Tailwind v4 + CSS modules + Vitest。

**Spec:** `docs/superpowers/specs/2026-06-13-post-view-timeline-v3-minimap.md`

---

## File Structure

- **Modify** `src/components/posts/view/paginationGeometry.ts` — 加 `MinimapWindow` 类型 + `computeMinimapWindow`。
- **Modify** `src/components/posts/view/paginationGeometry.test.ts` — 加 `computeMinimapWindow` 单测。
- **Modify** `src/styles/modules/post-view-timeline.css` — 移除 `.pvp-num*` 与 `pvp-pop`;`.pvp-cluster` 改叠放;加 `.pvp-minimap` 系列;reduced-motion 补 minimap。
- **Modify** `src/components/posts/view/PostViewPagination.tsx` — 移除数字/pop/pad2;加 minimap;`sr-only` 改可见范围;root 去掉 `h-6`。

---

## Task 1: 纯函数 computeMinimapWindow

**Files:**

- Modify: `src/components/posts/view/paginationGeometry.ts`
- Test: `src/components/posts/view/paginationGeometry.test.ts`

- [ ] **Step 1: Write the failing test**

在 `paginationGeometry.test.ts` 顶部 import 加上 `computeMinimapWindow`(与现有 import 并列),并在文件末尾追加:

```ts
describe('computeMinimapWindow', () => {
    it('returns zero window when there are no posts or none visible', () => {
        expect(computeMinimapWindow([], 0)).toEqual({ left: 0, width: 0 });
        expect(computeMinimapWindow([], 36)).toEqual({ left: 0, width: 0 });
    });

    it('maps the visible range to left/width percentages', () => {
        // 可见 0..2 of 36 -> left 0, width 3/36*100
        expect(computeMinimapWindow([0, 1, 2], 36)).toEqual({
            left: 0,
            width: (3 / 36) * 100,
        });
    });

    it('positions a mid-collection window', () => {
        // 可见 10..12 of 36
        expect(computeMinimapWindow([10, 11, 12], 36)).toEqual({
            left: (10 / 36) * 100,
            width: (3 / 36) * 100,
        });
    });

    it('handles a single visible post', () => {
        expect(computeMinimapWindow([5], 10)).toEqual({ left: 50, width: 10 });
    });

    it('clamps to the ends (first and last post)', () => {
        expect(computeMinimapWindow([0], 12)).toEqual({ left: 0, width: (1 / 12) * 100 });
        expect(computeMinimapWindow([35], 36)).toEqual({
            left: (35 / 36) * 100,
            width: (1 / 36) * 100,
        });
    });

    it('uses min/max so unordered indices still work', () => {
        expect(computeMinimapWindow([12, 10, 11], 36)).toEqual({
            left: (10 / 36) * 100,
            width: (3 / 36) * 100,
        });
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/posts/view/paginationGeometry.test.ts`
Expected: FAIL — `computeMinimapWindow is not a function`。

- [ ] **Step 3: Write minimal implementation**

在 `paginationGeometry.ts` 末尾追加:

```ts
export interface MinimapWindow {
    /** 高亮段左缘占整条的百分比 [0,100] */
    left: number;
    /** 高亮段宽度占整条的百分比 [0,100] */
    width: number;
}

/**
 * minimap 总览底条上的高亮段 = 当前可见窗口在整体里的位置与占比。
 * left = min(visible)/total,width = (max−min+1)/total(均为百分比)。
 */
export function computeMinimapWindow(visibleIndices: number[], totalPosts: number): MinimapWindow {
    if (totalPosts <= 0 || visibleIndices.length === 0) {
        return { left: 0, width: 0 };
    }
    const first = Math.min(...visibleIndices);
    const last = Math.max(...visibleIndices);
    return {
        left: (first / totalPosts) * 100,
        width: ((last - first + 1) / totalPosts) * 100,
    };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/components/posts/view/paginationGeometry.test.ts`
Expected: PASS(原 20 + 新 6 = 26 tests)。

- [ ] **Step 5: Commit**

```bash
git add src/components/posts/view/paginationGeometry.ts src/components/posts/view/paginationGeometry.test.ts
git commit -m "feat(post-view): add computeMinimapWindow geometry"
```

---

## Task 2: 时间线样式 v3(移除数字/pop,加 minimap,叠放)

**Files:**

- Modify: `src/styles/modules/post-view-timeline.css`

- [ ] **Step 1: 删除进度数字样式**

删除 `.pvp-num`、`.pvp-num-cur`、`.pvp-num-sep`、`.pvp-num-total` 四条规则(连同它们的 `/* 进度数字… */` 注释)。

- [ ] **Step 2: 把 `.pvp-cluster` 改为叠放,删掉旧的水平 `@media`**

把现有 `.pvp-cluster { … }` 规则替换为:

```css
/* cluster:垂直叠放 —— 时间线在上(主),minimap 在下(总览底条) */
.pvp-cluster {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
    gap: 9px;
}
```

并删除现有的 `@media (min-width: 1024px) { .pvp-cluster { justify-content: flex-start } .pvp-timeline { flex: 1 1 auto } }` 整块(叠放在所有宽度一致,不需要)。

- [ ] **Step 3: 把 `.pvp-timeline` 设为叠放上层**

把现有 `.pvp-timeline { … }` 替换为:

```css
/* 时间线 wrapper(主):aura + track 的定位上下文 */
.pvp-timeline {
    position: relative;
    order: 1;
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 26px;
    overflow: visible;
}
```

- [ ] **Step 4: 加 minimap 样式(放在 `.pvp-timeline` 规则之后)**

```css
/* minimap 总览底条(辅):整体位置 + 占比 */
.pvp-minimap {
    order: 2;
    position: relative;
    width: 100%;
    height: 4px;
    border-radius: 999px;
}
/* 底轨:极淡 + 两端各 30% 渐隐,不全长抢视觉 */
.pvp-minimap::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 999px;
    background: color-mix(in oklch, var(--foreground) 5%, transparent);
    -webkit-mask-image: linear-gradient(90deg, transparent, #000 30%, #000 70%, transparent);
    mask-image: linear-gradient(90deg, transparent, #000 30%, #000 70%, transparent);
}
/* 高亮段:中性色、半透明、无发光;left/width 由组件 inline 设 */
.pvp-minimap-window {
    position: absolute;
    top: 0;
    bottom: 0;
    border-radius: 999px;
    background: color-mix(in oklch, var(--foreground) 68%, transparent);
    opacity: 0.5;
    transition:
        left 380ms cubic-bezier(0.22, 0.61, 0.36, 1),
        width 380ms cubic-bezier(0.22, 0.61, 0.36, 1);
}
```

- [ ] **Step 5: 移除 active marker 的 pop**

把现有 `.pvp-marker.is-active { … }` 替换为(去掉 `transform-origin` 与 `pvp-pop`,只留 flow + breathe):

```css
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
```

并删除整个 `@keyframes pvp-pop { … }` 块。

- [ ] **Step 6: reduced-motion 补 minimap**

把现有 reduced-motion 块替换为:

```css
@media (prefers-reduced-motion: reduce) {
    .pvp-track,
    .pvp-marker,
    .pvp-minimap-window {
        transition: none;
    }

    .pvp-marker.is-active {
        animation: none;
    }
}
```

- [ ] **Step 7: 验证编译**

Run: `pnpm build`
Expected: 构建成功(85 page(s) built),无 CSS 解析错误。

- [ ] **Step 8: Commit**

```bash
git add src/styles/modules/post-view-timeline.css
git commit -m "feat(post-view): timeline v3 styles — minimap overview, stacked layout, drop number/pop"
```

---

## Task 3: 组件 v3(移除数字/pop,加 minimap,叠放)

**Files:**

- Modify (full replace): `src/components/posts/view/PostViewPagination.tsx`

接口 `{ onScrollToPost, className }` 与 caller 不变。

- [ ] **Step 1: 替换整个组件**

把 `src/components/posts/view/PostViewPagination.tsx` 全文替换为:

```tsx
import { useAtomValue } from 'jotai';
import { cn } from '@components/common/lib/utils';
import { postViewAtom } from '@stores/postViewAtom';
import {
    computeTimelineLayout,
    computeMinimapWindow,
    DEFAULT_GEOMETRY,
} from './paginationGeometry';

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
    const minimap = computeMinimapWindow(visibleIndices, totalPosts);

    // sr-only 进度文本:当前可见范围(无可见项时退化为 active 篇)
    const firstVisible = visibleIndices.length > 0 ? Math.min(...visibleIndices) : activeIndex;
    const lastVisible = visibleIndices.length > 0 ? Math.max(...visibleIndices) : activeIndex;

    return (
        <div
            className={cn(
                'post-view-pagination',
                'pvp-cluster group relative w-full overflow-visible pt-1 lg:h-auto',
                className
            )}
        >
            <span className="sr-only">
                {`正在浏览第 ${firstVisible + 1} 到 ${lastVisible + 1} 篇,共 ${totalPosts} 篇`}
            </span>

            {/* 时间线(主):aura 柔光底 + marker 轨道 */}
            <div className="pvp-timeline">
                <div className="pvp-aura" aria-hidden="true" />
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
                            aria-label={
                                marker.isActive ? undefined : `跳转到第 ${index + 1} 篇文章`
                            }
                        />
                    ))}
                </div>
            </div>

            {/* minimap 总览底条(辅):当前可见窗口在整体里的位置 + 占比 */}
            <div className="pvp-minimap" aria-hidden="true">
                <div
                    className="pvp-minimap-window"
                    style={{
                        left: `${minimap.left.toFixed(2)}%`,
                        width: `${minimap.width.toFixed(2)}%`,
                    }}
                />
            </div>
        </div>
    );
}
```

> 与 v2 的差异:删除 `pad2` + `.pvp-num` 进度数字;`sr-only` 改为可见范围;root 去掉 `h-6`(叠放高度由内容撑);新增 `.pvp-minimap`。marker 渲染与几何调用不变。

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: `0 errors`。

- [ ] **Step 3: 测试**

Run: `pnpm test:run`
Expected: 全部 PASS(几何含新增 minimap 测试,总数 200)。

- [ ] **Step 4: Lint**

Run: `pnpm lint`
Expected: 无输出。

- [ ] **Step 5: Commit**

```bash
git add src/components/posts/view/PostViewPagination.tsx
git commit -m "feat(post-view): replace number/pop with minimap overview + stacked layout"
```

---

## Task 4: 浏览器验证 + 全量检查

**Files:** 无代码改动(验证;如发现问题回到 Task 1-3 修复)。

- [ ] **Step 1: Build**

Run: `pnpm build`
Expected: 85 page(s) built,无错误。

- [ ] **Step 2: Start dev server**

Run: `pnpm dev`
Expected: ready,`http://localhost:4321/`。

- [ ] **Step 3: 手动验证 `/zh/post-view`(桌面宽度 ≥ 1024px)**

- [ ] 左下角是**垂直叠放**:上为时间线(marker),下为 minimap 总览底条;**没有进度数字**
- [ ] minimap 底轨极淡、两端渐隐;高亮段中性灰半透明、无发光
- [ ] 横向滚动:minimap 高亮段随视窗**移动 + 宽度变**(反映可见范围占比),时间线在上同步 morph
- [ ] active marker **无纵向 pop**(切换时不再弹高);流光/呼吸照旧
- [ ] 点击 marker 跳转;键盘 Tab 可达窗口内 marker
- [ ] **响应式**:窗口拉窄到 < 1024px,叠放仍成立、整体居中
- [ ] DevTools「prefers-reduced-motion: reduce」:流光/呼吸停,minimap 高亮段位置直接到位(无过渡)
- [ ] 暗 / 亮主题:底轨与高亮段(基于 `--foreground`)都正常

- [ ] **Step 4: 全量检查**

Run: `pnpm check`
Expected: 0 errors / 0 warnings。

- [ ] **Step 5: Commit(如 Step 3 有修复)**

```bash
git add -A
git commit -m "fix(post-view): timeline v3 polish from manual verification"
```

(无修复则跳过。)

---

## Self-Review(已核对)

- **Spec 覆盖**:minimap 底轨/高亮段(Task 2 样式 + Task 3 渲染 + Task 1 纯函数)、叠放布局(Task 2 cluster column + Task 3 DOM 顺序/order)、移除数字与 pop(Task 2 删规则 + Task 3 删渲染)、a11y sr-only 可见范围(Task 3)、reduced-motion 补 minimap(Task 2)、参数(Task 2 数值:底轨 5%/渐隐 30-70%/高亮段 68%/opacity 0.5)。✓
- **类型一致**:`MinimapWindow`/`computeMinimapWindow` 在 Task 1 定义,Task 3 同名同签名使用;CSS class(`pvp-minimap`/`pvp-minimap-window`)Task 2 定义、Task 3 引用。✓
- **无 placeholder**:每个代码步骤含完整代码与确切命令/预期。✓
