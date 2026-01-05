# 项目架构设计

本文档详细描述 Solitude Interface 的架构设计、数据流向和核心模块实现。

## 📐 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        Astro SSG 构建层                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  pages/     │  │  layouts/   │  │ components/ │              │
│  │  (路由)     │  │  (布局)     │  │  (UI组件)   │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          ▼                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    API 层 (src/api/)                       │  │
│  │  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌─────────────┐  │  │
│  │  │ ghost/  │  │ adapters │  │ clients │  │   utils/    │  │  │
│  │  │ posts   │──│  ghost   │──│  ghost  │──│ cache/error │  │  │
│  │  │settings │  └──────────┘  └─────────┘  └─────────────┘  │  │
│  │  └─────────┘                                               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           ▼
              ┌─────────────────────────┐
              │     Ghost CMS API       │
              │   (Content API v5.0)    │
              └─────────────────────────┘
```

---

## 🔄 数据流向

### 构建时数据获取流程

```
1. Astro 页面请求数据
   └─> src/pages/[lang]/index.astro
       └─> getStaticPaths()

2. 调用 Ghost API 模块
   └─> src/api/ghost/posts.ts
       └─> getPosts({ filter: 'tag:hash-lang-zh' })

3. Ghost 客户端发起请求
   └─> src/api/clients/ghost.ts
       └─> axios.get('/posts', { params })

4. 缓存检查 (命中则返回缓存)
   └─> src/api/utils/cache.ts
       └─> getFromCache(key) || fetchAndCache()

5. 数据适配转换
   └─> src/api/adapters/ghost.ts
       └─> adaptGhostPost(rawPost)
           ├─> 提取标签信息 (type, category, series)
           └─> 转换 URL 格式

6. 返回处理后的数据给页面
```

### 客户端交互流程

```
用户交互 → React 组件 → Jotai Store → UI 更新
                ↓
        src/stores/postViewAtom.ts
        src/stores/themeAtom.ts
```

---

## 📦 核心模块详解

### 1. API 层 (`src/api/`)

#### 模块结构

```
api/
├── config/env.ts       # 环境变量配置 (Ghost URL, API Key 等)
├── clients/ghost.ts    # Axios 客户端实例
├── ghost/
│   ├── posts.ts        # 文章相关 API
│   ├── settings.ts     # 站点设置 API
│   └── types.ts        # Ghost 数据类型定义
├── adapters/ghost.ts   # 数据转换器
└── utils/
    ├── cache.ts        # 请求缓存
    └── errorHandlers.ts # 错误处理
```

#### 关键函数

```typescript
// src/api/ghost/posts.ts
export async function getPosts(options?: GetPostsOptions): Promise<Post[]>;
export async function getPostBySlug(slug: string): Promise<Post | null>;
export async function getFeaturedPosts(): Promise<FeaturedPost[]>;

// src/api/ghost/settings.ts
export async function getSiteSettings(): Promise<SiteSettings>;
```

#### 适配器逻辑

```typescript
// src/api/adapters/ghost.ts
// 标签前缀定义
const TAG_PREFIXES = {
    TYPE: 'type-', // 文章类型: type-article, type-gallery
    CATEGORY: 'category-', // 分类: category-tech
    SERIES: 'series-', // 系列: series-astro-tutorial
};

// 从 Ghost 原始数据转换为前端格式
export function adaptGhostPost(post: GhostPost): Post {
    return {
        ...post,
        url: convertToFrontendUrl(post.id),
        post_type: extractTagValue(post.tags, 'TYPE'),
        post_category: extractTagValue(post.tags, 'CATEGORY'),
        post_series: extractTagValue(post.tags, 'SERIES'),
        post_general_tags: extractGeneralTags(post.tags),
    };
}
```

---

### 2. 多语言系统 (`src/lib/i18n.ts`)

#### 核心概念

```
Ghost 内部标签 (Internal Tags)
    #lang-zh  →  API slug: hash-lang-zh
    #i18n-key →  API slug: hash-i18n-key

URL 路由结构
    /{locale}/           → 文章列表页
    /{locale}/p/{key}    → 文章详情页
```

#### 关键函数

```typescript
// 语言配置
export const LOCALES = ['zh', 'ja', 'en'] as const;
export const DEFAULT_LOCALE: Locale = 'zh';

// 语言提取
export function extractLocaleFromTags(tags: PostTag[]): Locale | null;
export function extractI18nKey(tags: PostTag[]): string | null;

// 多语言文章过滤
export function filterPostsByLocale<T>(
    posts: T[],
    currentLocale: Locale,
): LocalizedPost<T>[];
```

#### 多语言文章过滤逻辑

```
输入: 所有文章 + 当前语言
处理:
  1. 按 i18n key 分组文章
  2. 每组优先选择当前语言版本
  3. 无当前语言版本时，选择 fallback 版本
  4. 按发布日期排序
输出: 去重后的文章列表 + fallback 标记
```

---

### 3. 组件架构 (`src/components/`)

#### 组件分层

```
components/
├── common/          # 基础 UI 组件 (无业务逻辑)
│   ├── button.tsx
│   ├── card.tsx
│   └── ...
├── layout/          # 布局组件
│   ├── navbar/      # 导航栏
│   └── dock/        # 底部工具栏
├── posts/           # 文章相关组件
│   ├── view/        # 文章列表视图
│   └── detail/      # 文章详情视图
└── pages/           # 页面专用组件
    ├── about/
    └── contact/
```

#### Astro vs React 组件选择

| 组件类型 | 文件格式        | 使用场景                               |
| -------- | --------------- | -------------------------------------- |
| 静态布局 | `.astro`        | Navbar, Footer, PageHero               |
| 交互组件 | `.tsx`          | ThemeSwitch, Carousel, ScrollContainer |
| 混合组件 | `.astro` + slot | 布局包裹交互内容                       |

---

### 4. 状态管理 (`src/stores/`)

#### Jotai Atoms

```typescript
// src/stores/themeAtom.ts
// 主题状态 (持久化到 localStorage)
export const themeAtom = atomWithLocalStorage<Theme>('theme', 'system');

// src/stores/postViewAtom.ts
// 文章视图状态
export const postViewAtom = atom<PostViewState>({
    totalPosts: 0,
    visibleIndices: [],
    activeIndex: 0,
    postDates: [],
});

// 跨组件通信: 时间线 → 滚动容器
export const scrollToPostAtom = atom<number | null>(null);
```

#### 状态流向

```
用户点击时间线节点
    ↓
DockTimelineMain.tsx
    ↓ setScrollToPostRequest(index)
scrollToPostAtom 更新
    ↓
PostViewScrollContainer.tsx (监听)
    ↓ scrollToPost(index)
滚动到对应文章
```

---

### 5. 样式系统 (`src/styles/`)

#### 样式层级

```
styles/
├── index.css              # 入口 (导入所有样式)
├── tailwind-settings.css  # Tailwind 配置
├── theme.css              # 主题变量 (CSS 自定义属性)
├── components/
│   ├── navbar.css
│   └── article/           # 文章样式
│       ├── article-content.css
│       ├── article-layout.css
│       └── article-toc.css
└── utilities/
    └── text-utilities.css
```

#### 主题系统

```css
/* src/styles/theme.css */
:root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    /* ... */
}

.dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    /* ... */
}
```

---

## 🔧 扩展指南

### 添加新的文章类型

1. 在 Ghost 中创建新标签: `type-newtype`
2. 在 `src/components/posts/view/cards/` 添加新卡片组件
3. 在 `PostViewContainer.astro` 中添加类型判断

### 添加新语言

1. 在 `src/lib/i18n.ts` 的 `LOCALES` 数组添加语言代码
2. 在 `LOCALE_NAMES` 和 `LOCALE_HTML_LANG` 添加映射
3. 在 `astro.config.mjs` 的 `i18n.locales` 添加语言
4. 在 Ghost 中使用 `#lang-{newlocale}` 标签

### 添加新 API 端点

1. 在 `src/api/ghost/` 创建新模块
2. 定义类型到 `types.ts`
3. 实现数据获取函数
4. 在需要时添加适配器转换

---

## 📊 性能考量

### 缓存策略

- 构建时: Ghost API 响应缓存 (内存缓存)
- 运行时: 静态生成的 HTML，无服务端请求

### 代码分割

- Astro 自动分割每个页面
- React 组件按需 hydration (`client:load`, `client:visible`)

### 图片优化

- 使用 Astro Image 组件
- 远程图片域名白名单配置

---

## 🧪 测试策略

| 测试类型 | 覆盖范围               | 命令                    |
| -------- | ---------------------- | ----------------------- |
| 单元测试 | 适配器、工具函数、i18n | `pnpm test:unit`        |
| 集成测试 | Ghost API 调用、数据流 | `pnpm test:integration` |

### 测试文件命名

- 单元测试: `*.test.ts`
- 集成测试: `*.integration.test.ts`
