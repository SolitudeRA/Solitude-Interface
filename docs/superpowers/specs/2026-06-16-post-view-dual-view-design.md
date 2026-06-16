# Post-view 双视图（画廊 + 可筛选列表）设计

> 状态：已确认方向，迭代实现中（分支 `feat/post-browse-dual-view`）
> 日期：2026-06-16

## 背景与问题

当前 `/[lang]/post-view` 是一条**单流横向画廊**：`listAllPosts()` 一次性加载全部文章，
`PostViewContainer` 把每一篇渲染成固定尺寸大卡塞进横向 scroll-snap 容器（`html/body: overflow:hidden`，
滚轮被劫持成横向滚动），配弹簧时间线 minimap + 底部进度条。

少量精选时体验很好，但当**文章 / 分类变多**（目标 ~100–200 篇 / 10–20 分类）会劣化：

- 无筛选 / 无搜索 —— 分类一多只能从头划到尾
- 仅线性顺序导航 —— 找特定主题 / 旧文成本随数量线性上升
- 全部卡片进 DOM（无虚拟化）—— 首屏 DOM / 图片随量膨胀
- 仅横向 + 锁死页面滚动 —— 大集合下无「一眼概览」

## 决策（已与用户确认）

| 维度     | 决策                                                                                 |
| -------- | ------------------------------------------------------------------------------------ |
| 页面定位 | **兼顾**：精选画廊做入口 + 可筛选/搜索的完整列表                                     |
| 形态     | **方案 B · 双视图切换**：沉浸画廊默认 +「画廊 ⇄ 列表」切换                           |
| 画廊内容 | **精选/最近 N 篇**（默认 16）+ 末尾「查看全部 →」入口卡；画廊本身不再承载全量        |
| 列表搜索 | **分面筛选 + 标题/摘要过滤**（零新依赖、纯静态）；接口预留，未来可接全文（Pagefind） |
| 规模     | ~100–200 篇 / 10–20 分类；全部元数据随 SSG 注入，**客户端即时筛选/分页**             |

## 复用的既有能力

- `Post` 已自带适配且本地化的分面字段：`post_category(_label)` / `post_type(_label)` /
  `post_series(_label,_slug,_number)` / `post_general_tags`，列表分面直接读这些字段，无需再解析 tags。
- `src/lib/tagRegistry.ts` 提供四类标签（type/category/series/topic）的多语言 label、order、color。
- `PostsShowcaseCards.tsx` 的卡片视觉语言（`--home-showcase-*` CSS 变量、type/category 标签药丸）。
- `filterPostsByLocale` / `getUIText` / `localizeTag` 等 i18n helper。

## 架构

单页双视图，**URL 即状态**：`?view=gallery|list&category=<slug>&type=<slug>&q=<text>&page=<n>`，
可深链、可后退。`post-view.astro`（SSG）按 locale 取全量后：

1. 切出**精选/最近 N**喂给画廊（SSR 大卡，沿用现有 `PostViewContainer`）。
2. 全量轻量元数据（title/excerpt/url/feature_image/published_at/分面字段）注入页面，供列表视图客户端筛选。

视图层：

- `PostBrowse`（React 岛, `client:load`）—— 顶部 `ViewToggle`，按 `view` 渲染画廊或列表；读/写 URL。
    - **画廊视图**：复用 `PostViewScrollContainer` + 卡片，喂精选 N + 「查看全部」入口卡（点→`view=list`）。
    - **列表视图** `PostListView`：
        - `PostFilterBar`：category chips（带注册表颜色）+ type chips + 标题/摘要搜索框 + 结果计数 + 清除。
        - `PostListGrid`：响应式紧凑卡（缩略图 + 标题 + 类型/分类药丸 + 日期），桌面 3–4 列。
        - `PostPagination`：客户端分页（默认 24/页）。

> 首期分面：**category + type + 标题/摘要搜索**。`filterPosts` 写成通用（facet 选择 + query），
> series / topic 为后续一行配置即可接入。

## 纯逻辑（TDD，沿用 `paginationGeometry.test.ts` 范式）

`src/lib/postBrowse.ts`，全部纯函数 + 单测：

- `extractFacets(posts)` → `{ categories: FacetOption[]; types: FacetOption[] }`（`{ slug,label,count }`，按 count/注册表 order 排序）。
- `filterPosts(posts, { category?, type?, query? })` → `Post[]`（query 子串匹配 title+excerpt，大小写无关）。
- `paginate(items, page, perPage)` → `{ items, page, totalPages, total }`（page 越界夹紧）。
- `parseBrowseParams(searchParams)` / `serializeBrowseParams(state)` → URL ⇄ `BrowseState`（非法值忽略/回退默认）。

## 数据流

- SSG 构建：`listAllPosts` → `filterPostsByLocale` → ① 精选 N 给画廊；② 全量 → 注入为 JSON。
- 客户端：`PostBrowse` 以 URL 为单一真源；筛选/分页是注入数据上的纯计算（memo）；交互写回 URL（`history.pushState`/`replaceState`）。
- 无服务端往返，筛选即时。

## 边界与可达性

- 空结果 → 「无匹配，清除筛选」CTA；无文章 → 沿用现有空态。
- 非法 / 未知 URL 参数 → 忽略并回退默认（不报错）。
- **无 JS**：`client:load`（非 `client:only`）下 Astro 会 SSR 列表初始态（默认 page 1、无筛选），首屏可见、可被索引；有 JS 再 hydrate 接管筛选/分页/深链。
- `ViewToggle` 用 `role=tablist`/`tab`；筛选 chips 可键盘操作、`aria-pressed`；结果计数 `aria-live=polite`。
- `prefers-reduced-motion`：沿用现有降级；列表切换无大动效。

## 测试

- `postBrowse.test.ts`：覆盖 `extractFacets`/`filterPosts`/`paginate`/URL 序列化往返与非法输入。
- 既有套件保持绿；`pnpm lint`/`typecheck`/`test:run`/`build` 全过。

## 非目标（本期不做）

- 全文搜索（Pagefind）—— 仅预留接口。
- 虚拟化 —— 100–200 篇分页足矣。
- 画廊交互重写 —— 画廊沿用现状，仅改「喂精选 N + 入口卡」。
- series / topic 分面 UI —— 逻辑层就绪，UI 留作快速跟进。
