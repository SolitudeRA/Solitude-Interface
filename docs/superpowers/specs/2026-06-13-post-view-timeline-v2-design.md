# Post-View 时间线 v2 — 进度数字 + 切换 pop + 响应式

> 日期:2026-06-13 · 状态:设计已确认(经可交互 demo 对齐)
> 在已上线的 `PostViewPagination`(统一 marker + 窗口化 + 流光呼吸,PR #61)基础上的增量迭代。

## 1. 背景与现状

`PostViewPagination` 当前结构(`src/components/posts/view/PostViewPagination.tsx`):root `<div>`(由 caller `PostViewScrollContainer` 传入 `lg:fixed lg:bottom-0 lg:left-0 lg:w-1/3 …` 定位)→ `.pvp-aura` + `.pvp-track`(`translateX` 居中)→ 一串 `.pvp-marker`(`is-active` 用渐变 + `pvp-flow`/`pvp-breathe`)。几何来自纯函数 `paginationGeometry.ts`,数据来自 `postViewAtom`(`totalPosts`/`visibleIndices`/`activeIndex`)。

本轮加三样:**进度数字**、**切换 pop 动效**、**移动端响应式布局**。

## 2. 范围

- 改 `PostViewPagination.tsx`:把 root 从"仅时间线"改为 **cluster `[进度数字][时间线]`**,加进度数字渲染。
- 改 `post-view-timeline.css`:进度数字样式 + `pvp-pop` keyframe + 响应式 + reduced-motion 覆盖。
- **不改** `paginationGeometry.ts`(几何不变)、`postViewAtom`(数据不变)、caller 的定位 className。

## 3. 设计

### 3.1 进度数字

- 内容:`{pad2(activeIndex + 1)} / {pad2(totalPosts)}`,例如 `03 / 36`。`pad2 = String(n).padStart(2, '0')`(≥100 自然显示三位,不截断)。
- 样式:
    - 当前篇号 `.pvp-num-cur`:黄青蓝渐变(`background-clip: text` + transparent color),字号 `clamp(1.5rem, 2.6vw, 2.1rem)`(= demo 中 numScale 1.0)。
    - 分隔 `.pvp-num-sep`(`/`):更灰、略小。
    - 总数 `.pvp-num-total`:灰、略小。
    - 容器 `.pvp-num`:`font-variant-numeric: tabular-nums`(等宽数字,切换时不抖动)、baseline 对齐、`user-select: none`。
- 位置:时间线**左侧**(cluster 第一个子元素)。
- a11y:`.pvp-num` 视觉元素 `aria-hidden="true"`;另加一个 Tailwind `sr-only` 文本 `第 {activeIndex + 1} 篇,共 {totalPosts} 篇` 供屏幕阅读器播报进度(顺带补上当前 active marker 无 label 的 gap)。

### 3.2 cluster 结构

root 从"时间线居中"改为 cluster:

```
.post-view-pagination.pvp-cluster   (flex, items-center, gap)
├─ .pvp-num (+ sr-only 进度文本)     ← 进度数字,flex 不伸缩
└─ .pvp-timeline                     ← 时间线 wrapper(relative, flex, items-center, justify-center)
   ├─ .pvp-aura                       ← 柔光底(absolute,居中到 timeline wrapper)
   └─ .pvp-track (translateX)         ← marker 轨道(不变)
```

- `.pvp-aura` 从 root 移到 `.pvp-timeline` 内(其定位上下文随之),仍居中到时间线区域。
- `.pvp-track` / `.pvp-marker` 渲染逻辑不变(仍 `computeTimelineLayout` 驱动)。

### 3.3 切换 pop

- active marker 在 `activeIndex` **切换到新 marker 时** 纵向轻弹一下(scaleY pop),给离散切换一个"落定"反馈。
- 实现:新增 `@keyframes pvp-pop`(`scaleY: 1 → 1.9 → 1`,0.42s,`cubic-bezier(0.22,0.61,0.36,1)`),**追加**到 `.pvp-marker.is-active` 的 `animation` 列表(与 `pvp-flow`/`pvp-breathe` 并列)。
- 触发机制(纯 CSS,无需 JS):`is-active` 随 `activeIndex` 移动到新 marker,新 marker 获得 `is-active` class 时其 animation(含一次性的 `pvp-pop`)启动 → pop 播一次;`pvp-flow`/`pvp-breathe` 为 infinite 持续。旧 active marker 失去 class、动画停止。同一 marker 持续 active 时不重复 pop。
- `transform-origin: center` 确保纵向居中弹动。

### 3.4 响应式

- **桌面(≥1024px,lg)**:cluster 在 caller 的 `fixed bottom-left w-1/3` 区域内,`justify-content: flex-start`(进度数字靠左),`.pvp-timeline` `flex: 1 1 auto` 撑开剩余宽度。
- **移动/平板(<1024px)**:`PostViewPagination` 在滚动容器内流式(root `w-full`),cluster `justify-content: center`、`.pvp-timeline` `flex: 0 1 auto`,**进度数字 + 时间线整体居中**。

### 3.5 reduced-motion

现有 `@media (prefers-reduced-motion: reduce)` 已对 `.pvp-marker.is-active { animation: none }`——自动覆盖新增的 `pvp-pop`。进度数字的 `.pvp-num-cur` 若加任何过渡也在该 media 下关闭(保留静态渐变)。

## 4. 最终参数(经 demo 确认)

| 参数                   | 值                                                                       |
| ---------------------- | ------------------------------------------------------------------------ |
| 进度数字大小(numScale) | **1.0**(即 `.pvp-num-cur` = `clamp(1.5rem, 2.6vw, 2.1rem)`)              |
| 进度数字格式           | `pad2(active+1) / pad2(total)`,当前篇号渐变、总数灰                      |
| 切换 pop               | 开 · `pvp-pop` scaleY 1→1.9→1 · 0.42s · `cubic-bezier(0.22,0.61,0.36,1)` |
| 过渡 trans             | 380ms(marker) / 420ms(容器 transform)                                    |
| 流光 flow              | 3.2s linear infinite                                                     |
| 呼吸 breathe           | 2.4s ease-in-out infinite                                                |
| 窗口化                 | K 3 / J 4 / sharp 3.7(沿用,不变)                                         |

## 5. 测试

- 几何纯函数(`paginationGeometry.ts`)不变 → 现有 20 个测试保持绿。
- `pad2` 若抽成可导出小工具,补 1-2 个单测(`pad2(3)==='03'`、`pad2(36)==='36'`、`pad2(120)==='120'`);否则作为组件内联辅助。
- 视觉 / 动效 / 响应式 / pop / reduced-motion / sr-only:浏览器手动验证(桌面 + 窄屏 + DevTools reduced-motion 模拟 + SR 走查)。

## 6. 参考

- 可交互原型:`public/design-demos/timeline-v2.html`(进度数字 + pop + 响应式 + 可调参)。合入后移除(实现计划里定)。
