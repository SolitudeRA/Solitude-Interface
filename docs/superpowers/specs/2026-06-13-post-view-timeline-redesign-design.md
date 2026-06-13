# Post-View 时间线重设计 — 统一 marker · 离散 morph · 窗口化

> 日期:2026-06-13 · 状态:设计已确认(经可交互 demo 对齐),待转实现计划
> 目标组件:`src/components/posts/view/PostViewPagination.tsx`

## 1. 背景与现状

post-view 页面(`/[lang]/post-view`,横向文章画廊)桌面端**左下角固定**(`lg:fixed lg:bottom-0 lg:left-0 lg:w-1/3`)的 `PostViewPagination.tsx` 是一个**时间线 / 分页进度指示器**,跟随横向滚动实时更新、可点击 marker 跳转(读 `postViewAtom`,经 `onScrollToPost` 滚动)。

**现状由三种割裂元素拼成:**

- 中间一串**横杠**(宽度随距 activeIndex 渐变:40/28/20/14)
- 两侧**省略号**(各 3 个固定小圆点,`MAX_OUTSIDE_MARKERS = 3` 之外)
- 首尾**空心圆圈**(`isEndpoint`)

active 用黄青蓝渐变 + 发光高亮;视口内 marker 更亮、视野外更暗。

**问题:** 横杠 / 点 / 圆圈三种形态割裂,视觉不"一体";动效较静态。

## 2. 目标

1. **统一 marker**:横杠 ⇄ 圆点是**同一元素**的两个形态端点,按"距 active 的距离"在两者间 morph。取消独立省略号点与首尾圆圈。
2. **离散 morph**:仍按**整数 `activeIndex`** 切换(数据模型不变),切换时用 CSS 过渡弹性 morph(横杠↔点),整条丝滑平移。
3. **窗口化(长度恒定)**:不管文章多少,时间线长度恒定;外侧渐隐点表达"还有更多"。
4. **动效**:active 流光(渐变流动)+ 呼吸(glow 脉冲)。
5. **约束**:纯几何**不加文字**;**位置不变**(桌面左下角);沿用现配色。

## 3. 范围

- 重写 `PostViewPagination.tsx` 的渲染与样式。
- **数据模型 `postViewAtom` 不变**(`totalPosts / visibleIndices / activeIndex` 足够;B 方向用整数 activeIndex)。
- 不动 `PostViewScrollContainer` 的滚动/居中逻辑、不动定位 className。

## 4. 设计细节

### 4.1 统一 marker 形态

- 每篇文章 = 一个 marker(`<button>`)。**删除**独立省略号(3 点)与首尾空心圆圈。
- **高度恒定 6px,`border-radius = height/2`(永远 pill)**;当 `width → height` 即自然成圆点 → 横杠和点是同一元素,morph 本质只是 **width 动画**。
- `width = widthForDistance(d)`,`d = |i - activeIndex|`:`smoothstep(0, sharp, d)` 从 `BAR_W` 插值到 `DOT_W`(近=横杠、远=点)。

### 4.2 窗口化(长度恒定)— 核心

- 窗口半径 `R = K + J`(active 每侧最多显示 R 个 marker)。
- **所有 marker 都保留在 DOM**;窗口外的收缩到 `width:0 + margin-inline:0 + opacity:0`(**完全收起、不占位**)→ 整条长度恒定。
- 窗口内:
    - `d ≤ K`:完整 marker(横杠,按距离 morph)
    - `K < d ≤ R`:外侧点,`opacity` 按 `1 - smoothstep(K, R, d)` **渐隐**(最外侧→0,表示"还有更多")
- 进出窗口时,因 `width / margin` 有过渡 → marker 从 0 平滑展开 / 收起,保持 morph 连续。
- active 居中:`tl-inner` 用 `translateX` 偏移(只累计窗口内 marker 的 `width + margin`,窗口外贡献 0)。
- 贴边场景(active 在首/尾附近):一侧 marker 不足 R,窗口自然不对称,长度仍 ≈ 恒定;不足侧不应出现多余渐隐点。

### 4.3 离散切换的丝滑

- marker `transition: width / height / margin / opacity / background <trans> cubic-bezier(0.22,0.61,0.36,1)`
- 容器 `tl-inner transition: transform <offset-trans> <ease>`(= trans + 40ms)
- `activeIndex` 变化时,morph + 平移一气呵成。

### 4.4 动效(流光 + 呼吸)

- active 背景 = 黄青蓝渐变 `linear-gradient(90deg,#ffd166,#6ee7ff,#8aa2ff,#6ee7ff,#ffd166)`,`background-size:200%` + `flow` keyframe **3.2s linear infinite**(流动)。
- glow:`box-shadow`(cyan `rgb(110 231 255 /.45)` + blue `rgb(138 162 255 /.28)`)+ `breathe` keyframe **2.4s ease-in-out infinite**(脉冲)。
- 柔光底 aura(radial-gradient blur)随时间线居中。

### 4.5 可见性(明暗)

- `visibleIndices`(视口内,现有 atom)→ marker 更亮(opacity 1);窗口内但非视口内 → base ≈ 0.5。

### 4.6 边界 / 可访问性 / 降级

- `prefers-reduced-motion: reduce`:关闭 `flow`/`breathe` 持续动画与 morph 过渡(直接到位),保留静态渐变高亮。
- marker 为 `<button>`,点击 `onScrollToPost(index)` 跳转;**窗口内** `tabIndex=0 / pointer-events:auto`,**窗口外** `tabIndex=-1 / pointer-events:none`。
- `aria-label` = 篇号(第 N 篇),active 标 `aria-current="true"`。
- `totalPosts === 0` 不渲染(沿用现有)。

### 4.7 纯函数抽取(可测)

把几何计算抽成**纯函数**模块(建议 `src/components/posts/view/paginationGeometry.ts`),用 Vitest 单测:

- `markerWidth(distance, { barW, dotW, sharp })`
- `markerOpacity(distance, { visible, K, R })`
- 窗口判断 / 居中偏移计算(给定 widths、activeIndex → translateX)

组件本身(DOM/动画)仍靠 demo + 浏览器手动验证。

## 5. 最终参数(经 demo 确认)

| 参数             | 值                               | 说明                                      |
| ---------------- | -------------------------------- | ----------------------------------------- |
| `BAR_W` 横杠宽   | **36**                           | 近端横杠最大宽度                          |
| `DOT_W` 圆点宽   | **6**                            | 远端收缩点宽度                            |
| `GAP` 间距       | **16**                           | marker 间距(`margin-inline = GAP/2`)      |
| `sharp` 形变锐度 | **3.7**                          | `smoothstep(0, sharp, d)` 上界            |
| `K` 横杠半径     | **3**                            | 每侧完整 marker 个数                      |
| `J` 外侧点       | **4**                            | 每侧渐隐点个数(窗口半径 R = K + J = 7)    |
| `trans` 过渡     | **380ms**                        | marker morph 过渡(容器 transform = 420ms) |
| `flow` 流光      | **3.2s linear infinite**         | active 渐变流动                           |
| `breathe` 呼吸   | **2.4s ease-in-out infinite**    | active glow 脉冲                          |
| 过渡曲线         | `cubic-bezier(0.22,0.61,0.36,1)` | morph / 平移共用                          |

## 6. 验证

- **单测**:`paginationGeometry` 纯函数(距离→宽度、窗口边界 d=R 渐隐到 0、贴边不溢出、居中偏移)。
- **手动**:浏览器跑 post-view,验证 从头滚到尾长度恒定、morph 丝滑、流光/呼吸、贴边场景、`prefers-reduced-motion`、键盘可达(窗口内 marker 可 Tab/Enter)。

## 7. 参考

- 设计阶段曾用可交互原型(`timeline-b-preview.html` / `timeline-redesign.html`)对齐方案与最终参数,合入后已移除(见 git 历史 commit `07321b5`)。
