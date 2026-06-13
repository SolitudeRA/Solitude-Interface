# Post-View 时间线 v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 给已上线的 `PostViewPagination` 加进度数字(`03 / 36`)、切换 pop 动效、移动端响应式布局。

**Architecture:** root 从"仅时间线"改为 cluster `[进度数字][时间线]`;进度数字纯展示(读 `postViewAtom` 的 `activeIndex`/`totalPosts`),时间线包一层 wrapper;切换 pop 是纯 CSS(`pvp-pop` 追加到 `.is-active` 的 animation,随 `is-active` 移到新 marker 自动播一次)。几何 `paginationGeometry.ts` 与数据模型不变。

**Tech Stack:** React 19 + Jotai + TypeScript(strict)+ Tailwind v4 + CSS modules。

**Spec:** `docs/superpowers/specs/2026-06-13-post-view-timeline-v2-design.md`

---

## File Structure

- **Modify** `src/styles/modules/post-view-timeline.css` — 加 `.pvp-cluster` / `.pvp-num*` / `.pvp-timeline` 布局、`@keyframes pvp-pop`、响应式 `@media`;给 `.pvp-marker.is-active` 追加 `pvp-pop` 与 `transform-origin`。
- **Modify** `src/components/posts/view/PostViewPagination.tsx` — root 改 cluster 结构,加进度数字 + `sr-only` 进度文本;时间线包进 `.pvp-timeline`。

无新单测逻辑(本轮是视觉/CSS;`pad2` 是 `String#padStart` 的内联包装,trivial 不单测)。几何的 20 个现有测试保持绿。

---

## Task 1: 时间线样式 v2(进度数字 + cluster + pop + 响应式)

**Files:**

- Modify: `src/styles/modules/post-view-timeline.css`

- [ ] **Step 1: 给 `.pvp-marker.is-active` 追加 pop 动画与 transform-origin**

把现有规则(原为 flow + breathe 两条 animation)替换为:

```css
.pvp-marker.is-active {
    background: linear-gradient(90deg, #ffd166, #6ee7ff, #8aa2ff, #6ee7ff, #ffd166);
    background-size: 200% 100%;
    box-shadow:
        0 0 10px rgb(110 231 255 / 0.45),
        0 0 20px rgb(138 162 255 / 0.28);
    transform-origin: center;
    animation:
        pvp-flow 3.2s linear infinite,
        pvp-breathe 2.4s ease-in-out infinite,
        pvp-pop 0.42s cubic-bezier(0.22, 0.61, 0.36, 1);
}
```

- [ ] **Step 2: 加 `@keyframes pvp-pop`(放在 `@keyframes pvp-breathe` 之后)**

```css
@keyframes pvp-pop {
    0% {
        transform: scaleY(1);
    }
    40% {
        transform: scaleY(1.9);
    }
    100% {
        transform: scaleY(1);
    }
}
```

- [ ] **Step 3: 在文件顶部注释块之后、`.pvp-track` 规则之前,插入 cluster / 进度数字 / 时间线 wrapper / 响应式规则**

```css
/* cluster:进度数字 + 时间线(桌面左对齐,移动端居中) */
.pvp-cluster {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(12px, 1.6vw, 22px);
}

/* 进度数字:当前篇号渐变高亮 + 灰色总数,等宽 */
.pvp-num {
    flex: 0 0 auto;
    display: flex;
    align-items: baseline;
    gap: 0.32em;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    user-select: none;
}

.pvp-num-cur {
    font-size: clamp(1.5rem, 2.6vw, 2.1rem);
    font-weight: 850;
    letter-spacing: 0.01em;
    background: linear-gradient(90deg, #ffd166, #6ee7ff, #8aa2ff);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}

.pvp-num-sep {
    font-size: clamp(1rem, 1.7vw, 1.35rem);
    font-weight: 600;
    color: color-mix(in oklch, var(--foreground) 32%, transparent);
}

.pvp-num-total {
    font-size: clamp(0.95rem, 1.5vw, 1.2rem);
    font-weight: 700;
    color: color-mix(in oklch, var(--foreground) 50%, transparent);
}

/* 时间线 wrapper(aura + track 的定位上下文) */
.pvp-timeline {
    position: relative;
    flex: 0 1 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 26px;
    overflow: visible;
}

/* 桌面(lg+):进度数字靠左,时间线撑开剩余宽度 */
@media (min-width: 1024px) {
    .pvp-cluster {
        justify-content: flex-start;
    }

    .pvp-timeline {
        flex: 1 1 auto;
    }
}
```

> 注:`.pvp-aura` 现有规则(`left:50%; top:50%; width:60%; transform:translate(-50%,-50%)`)不变——它会相对新的 `.pvp-timeline`(`position: relative`)居中。现有 `@media (prefers-reduced-motion: reduce)` 的 `.pvp-marker.is-active { animation: none }` 已自动覆盖新加的 `pvp-pop`,无需改动。

- [ ] **Step 4: 验证样式编译**

Run: `pnpm build`
Expected: 构建成功(85 page(s) built),无 CSS 解析错误。

- [ ] **Step 5: Commit**

```bash
git add src/styles/modules/post-view-timeline.css
git commit -m "feat(post-view): timeline v2 styles — progress number, cluster, switch pop, responsive"
```

---

## Task 2: 组件加进度数字 + cluster 结构

**Files:**

- Modify (full replace): `src/components/posts/view/PostViewPagination.tsx`

接口 `{ onScrollToPost, className }` 不变;`PostViewScrollContainer.tsx:361` 的调用与传入的定位 className 不变。

- [ ] **Step 1: 替换整个组件**

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

/** 补零到至少两位(总数 ≥ 100 时自然显示三位) */
const pad2 = (n: number): string => String(n).padStart(2, '0');

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
                'pvp-cluster group relative h-6 w-full overflow-visible pt-1 lg:h-auto',
                className
            )}
        >
            {/* 进度数字(视觉);屏幕阅读器用下方 sr-only 文本 */}
            <div className="pvp-num" aria-hidden="true">
                <span className="pvp-num-cur">{pad2(activeIndex + 1)}</span>
                <span className="pvp-num-sep">/</span>
                <span className="pvp-num-total">{pad2(totalPosts)}</span>
            </div>
            <span className="sr-only">{`第 ${activeIndex + 1} 篇,共 ${totalPosts} 篇`}</span>

            {/* 时间线:aura 柔光底 + marker 轨道 */}
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
        </div>
    );
}
```

> 与上一版的差异:root 去掉 `flex items-center justify-center`(改由 `.pvp-cluster` 管理 flex 布局),加 `pvp-cluster`;新增 `.pvp-num` 进度数字 + `sr-only` 进度文本;`.pvp-aura` 与 `.pvp-track` 包进 `.pvp-timeline`。marker 渲染逻辑与几何调用完全不变。

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: `0 errors`。

- [ ] **Step 3: 跑测试(几何测试应保持绿)**

Run: `pnpm test:run`
Expected: 全部 PASS(几何 20 测试不受影响,总数 194)。

- [ ] **Step 4: Lint**

Run: `pnpm lint`
Expected: 无输出(0 warnings/errors)。

- [ ] **Step 5: Commit**

```bash
git add src/components/posts/view/PostViewPagination.tsx
git commit -m "feat(post-view): add progress number + sr-only to timeline"
```

---

## Task 3: 浏览器手动验证 + 全量检查

**Files:** 无代码改动(验证;如发现问题回到 Task 1/2 修复)。

- [ ] **Step 1: Build**

Run: `pnpm build`
Expected: 85 page(s) built,无错误。

- [ ] **Step 2: Start dev server**

Run: `pnpm dev`
Expected: `astro ... ready`,`http://localhost:4321/`。

- [ ] **Step 3: 手动验证 `/zh/post-view`(桌面宽度 ≥ 1024px)**

- [ ] 左下角集群:进度数字 `01 / 36` 在时间线左侧,当前篇号渐变高亮、总数灰、等宽
- [ ] 横向滚动:进度数字随当前篇号更新(`02 / 36` → `03 / 36` …),时间线 active 同步
- [ ] **切换 pop**:active marker 在切换到新篇时纵向轻弹一下(scaleY)
- [ ] active 流光 + 呼吸照旧;窗口化 / morph 照旧
- [ ] 点击 marker 跳转;键盘 Tab 可达窗口内 marker
- [ ] **响应式**:把窗口拉窄到 < 1024px(或用 DevTools 设备模拟),集群变为居中、进度数字 + 时间线整体居中
- [ ] DevTools「Emulate prefers-reduced-motion: reduce」:flow/breathe/pop 全部停止,保留静态渐变高亮与静态进度数字
- [ ] 暗 / 亮主题:进度数字渐变与灰色、marker 都正常

- [ ] **Step 4: 全量检查**

Run: `pnpm check`
Expected: `lint` + `format:check` + `typecheck` 全过(0 errors / 0 warnings)。

- [ ] **Step 5: Commit(如 Step 3 有修复)**

```bash
git add -A
git commit -m "fix(post-view): timeline v2 polish from manual verification"
```

(无修复则跳过。)

---

## Self-Review(已核对)

- **Spec 覆盖**:进度数字(Task 1 样式 + Task 2 渲染 + sr-only)、cluster 结构(Task 1 `.pvp-cluster`/`.pvp-timeline` + Task 2 DOM)、切换 pop(Task 1 keyframe + is-active)、响应式(Task 1 `@media` + `.pvp-cluster` 默认 center)、reduced-motion(沿用现有 `@media`,已覆盖 pop)、参数表(Task 1 数值)。✓
- **类型一致**:`pad2` 定义于 Task 2 并在同文件使用;CSS class 名(`pvp-cluster`/`pvp-num`/`pvp-num-cur`/`pvp-num-sep`/`pvp-num-total`/`pvp-timeline`/`pvp-pop`)在 Task 1 定义、Task 2 引用,完全一致。✓
- **无 placeholder**:每个代码步骤含完整代码与确切命令/预期。✓
