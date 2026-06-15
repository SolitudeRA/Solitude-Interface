# Post-View 时间线 v3 — 底边总览进度条(替换进度数字)

> 日期:2026-06-13(2026-06-15 更新落地结论)
> **状态:已落地。** 进度数字 / 切换 pop 已移除(PR #62 → #63);角落时间线保留。
> 本轮在角落时间线之外,新增一条**全宽钉在视窗最底边的「氛围光晕 × 进度填充」总览进度条**
> (`PostViewOverview`):月白柔光随滚动进度从左生长、前缘柔焦光头标记当前位置;rAF 临界阻尼弹簧平滑、
> 滚动越快辉光越隐(防抢视觉焦点)、reduced-motion 直接到位。滚动量经独立的 `postViewScrollAtom`
> 传入,只重渲染自身、不波及时间线;进度由纯函数 `computeScrollProgress` 计算(带单测)。
> 下文 §3.1–§3.6 记录的是早期 minimap(scrollbar thumb 滑块)方案,**已被本设计取代,仅作历史参考**。

## 1. 背景与现状

v2 给时间线左侧加了**进度数字**(`03 / 36`)和 **切换 pop**(active marker 纵向弹动),桌面左对齐 / 移动居中。经设计迭代,结论:

- 进度数字(任何形式:当前/总数、可见范围、范围+脚注总数)都**显得突兀**,与精致的动态时间线不搭。
- 切换 pop 的纵向弹动**多余**。

最终改为:用一条**极简的 minimap 总览底条**(几何方式表达"整体位置")替代数字,并把布局改为**垂直叠放**。

## 2. 范围

- 改 `src/components/posts/view/PostViewPagination.tsx`:移除进度数字与 pop,加 minimap,布局改叠放。
- 改 `src/styles/modules/post-view-timeline.css`:移除 `.pvp-num*` 与 `pvp-pop`,加 minimap 样式与叠放/响应式。
- 加 `src/components/posts/view/paginationGeometry.ts` 纯函数 `computeMinimapWindow`(+ 单测)。
- 时间线本体(marker 几何 `computeTimelineLayout`、流光/呼吸、窗口化)与数据模型 `postViewAtom` 不变。

## 3. 设计

### 3.1 minimap 总览底条

一条代表**全部文章**的细轨,上面一个高亮段表示**当前可见窗口在整体里的位置和占比**(像滚动条缩略图):

- **底轨**(`.pvp-minimap` 的 `::before` 伪元素):`background: color-mix(in oklch, var(--foreground) 5%, transparent)`(极淡),`mask-image: linear-gradient(90deg, transparent, #000 30%, #000 70%, transparent)`(两端各 30% 渐隐,只中段隐约可见,不全长抢视觉)。高 4px、圆角。
- **高亮段 / 滑块**(`.pvp-minimap-window`,绝对定位)—— **scrollbar thumb 式**(改自初版"可见范围占比":占比绑定可见卡片数,滚动时数目在 ±1 抖动导致滑块长度抖且偏长):
    - `width` = `min(clientWidth / scrollWidth, 上限)`(视口占内容比例,封顶 `DEFAULT_MINIMAP_MAX_WIDTH = 24%`)。**与可见卡片数解耦,滚动时长度恒定不抖**;文章多时按真实比例越来越短,文章少时封顶避免占去半条轨。
    - `left` = `滚动进度 × (100 − width)`,进度 = `scrollLeft / (scrollWidth − clientWidth)` 夹紧到 `[0,1]`。**按进度映射满行程**,故封顶变窄后末端仍贴右缘;同时吃掉 rubber-band 过冲。
    - `background: color-mix(in oklch, var(--foreground) 68%, transparent)`(中性色,**不用品牌渐变**,避免与上方 active marker 抢色),`opacity: 0.5`,**无 box-shadow / 无流光动画**,圆角。
    - `transition`:**`left` 不加过渡**(直接跟随 `scrollLeft` 1:1,避免滞后飘移);`width` 仅在 resize 时平滑(240ms)。

### 3.2 纯函数 `computeMinimapWindow`

```
computeMinimapWindow(scrollLeft, scrollWidth, clientWidth, maxWidthPct = DEFAULT_MINIMAP_MAX_WIDTH): { left, width }
```

- `scrollWidth <= 0` 或 `clientWidth <= 0` → `{ left: 0, width: 0 }`。
- `clientWidth >= scrollWidth`(内容未超出视口)→ `{ left: 0, width: 100 }`(满轨)。
- 否则 `width = min(clientWidth / scrollWidth * 100, maxWidthPct)`;`progress = clamp(scrollLeft / (scrollWidth − clientWidth), 0, 1)`;`left = progress * (100 − width)`(百分比,组件设为 inline `style.left/width = 'x%'`)。
- `maxWidthPct` 默认 `DEFAULT_MINIMAP_MAX_WIDTH = 24`;组件按默认调用(传 `100` 可关闭封顶,仅供测试)。
- 滚动尺寸经 `postViewAtom`(新增 `scrollLeft / scrollWidth / clientWidth` 字段,由 `PostViewScrollContainer` 的滚动监听写入)传入。

### 3.3 叠放布局

cluster 改为**垂直**(`flex-direction: column`):

```
.post-view-pagination.pvp-cluster   (column, items stretch, justify center, gap)
├─ .pvp-timeline   (order 1, 主:aura + track + markers)
└─ .pvp-minimap    (order 2, 辅:总览底条,撑满宽度)
```

- 时间线在上(主角,marker 可点),minimap 在下方做总览底条(`width: 100%`)。
- **响应式**:桌面在 caller 的 `lg:fixed bottom-left w-1/3` 区域内;移动端流式居中。叠放在两种宽度下都成立(垂直堆叠,各自撑满 cluster 宽度)。

### 3.4 移除

- 进度数字:`.pvp-num` / `.pvp-num-cur` / `.pvp-num-sep` / `.pvp-num-total` 及组件里的渲染。
- 切换 pop:`@keyframes pvp-pop` 与 `.pvp-marker.is-active` animation 列表里的 `pvp-pop`、`transform-origin`。

### 3.5 a11y

- 时间线 marker 仍是 `<button>`,可点击/键盘可达(不变)。
- minimap 纯视觉,`aria-hidden="true"`。
- 保留一个 `sr-only` 进度文本,改为可见范围:`正在浏览第 {min+1} 到 {max+1} 篇,共 {totalPosts} 篇`(`visibleIndices` 为空时退化为当前 active 篇)。

### 3.6 reduced-motion

现有 `@media (prefers-reduced-motion: reduce)` 关 `.pvp-marker.is-active { animation: none }`(时间线流光/呼吸);minimap-window 仅有 `left/width` 过渡,在该 media 下补 `transition: none`(直接到位)。

## 4. 最终参数

| 项           | 值                                                                                                                                      |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| 布局         | 垂直叠放(时间线上 / minimap 下)                                                                                                         |
| minimap 底轨 | `--foreground` 5% 透明 · mask 两端各 30% 渐隐 · 高 4px                                                                                  |
| minimap 滑块 | `--foreground` 68% · `opacity 0.5` · 无发光 · scrollbar thumb:`width = min(clientWidth/scrollWidth, 24%)` · `left = 进度 × (100−width)` |
| 过渡         | `left` 无过渡(1:1 跟随滚动) · `width` 240ms(仅 resize)                                                                                  |
| 时间线本体   | 不变(K3 / J4 / sharp3.7 / 流光3.2s / 呼吸2.4s / morph 380ms)                                                                            |
| 已移除       | 进度数字、切换 pop                                                                                                                      |

## 5. 测试

- `computeMinimapWindow` 纯函数单测(无可滚内容、内容适配满轨、宽度随视口/内容比例且跨位置恒定、按进度定位、末端右缘对齐、过冲夹紧、长内容短滑块)。
- 几何 `computeTimelineLayout` 现有 20 测试保持绿。
- 视觉/叠放/响应式/reduced-motion/sr-only:浏览器手动验证。

## 6. 参考

- 可交互原型:`public/design-demos/timeline-v2.html`(最终含 minimap 叠放)。合入后移除。
