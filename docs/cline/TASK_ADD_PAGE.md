# 任务上下文: 添加新页面

## 📋 任务类型

创建新的 Astro 页面路由

## 🎯 快速参考

### 页面放置位置

```
src/pages/
├── index.astro              # 首页 (重定向到默认语言)
├── contact.astro            # 无多语言的静态页面
├── rss.xml.ts               # 全站 RSS 订阅
├── posts/                   # 文章相关页面
│   └── [post].astro         # 文章详情 (旧路由)
└── [lang]/                  # 多语言动态路由
    ├── index.astro          # /{lang}/ 首页
    ├── about.astro          # /{lang}/about 关于页
    ├── post-view.astro      # /{lang}/post-view 文章列表
    ├── privacy-policy.astro # /{lang}/privacy-policy 隐私政策
    ├── rss.xml.ts           # /{lang}/rss.xml 语言专属 RSS
    └── p/
        └── [key].astro      # /{lang}/p/{key} 文章详情
```

### URL 路由规则

| 文件路径                      | URL                             |
| ----------------------------- | ------------------------------- |
| `pages/foo.astro`             | `/foo`                          |
| `pages/[lang]/foo.astro`      | `/zh/foo`, `/ja/foo`, `/en/foo` |
| `pages/[lang]/bar/[id].astro` | `/zh/bar/123`                   |
| `pages/rss.xml.ts`            | `/rss.xml`                      |

---

## ✅ 创建步骤

### 1. 创建多语言页面

```astro
---
// src/pages/[lang]/new-page.astro
import { LOCALES, type Locale } from '@lib/i18n';
import BaseLayout from '@layouts/base/BaseLayout.astro';

interface Props {
    lang: Locale;
}

export async function getStaticPaths() {
    return LOCALES.map((lang) => ({
        params: { lang },
        props: { lang },
    }));
}

const { lang } = Astro.props;

// 页面元数据
const siteTitle = '页面标题';
const coverImageUrl = null; // 封面图片 URL，可为 URL | string | null
---

<BaseLayout siteTitle={siteTitle} coverImageUrl={coverImageUrl} locale={lang}>
    <main class="container mx-auto px-4 py-8">
        <h1 class="mb-6 text-3xl font-bold">{siteTitle}</h1>
        <!-- 页面内容 -->
    </main>
</BaseLayout>
```

### 2. 获取 Ghost 数据 (可选)

```astro
---
import { getPosts } from '@api/ghost/posts';
import { filterPostsByLocale, LOCALES, type Locale } from '@lib/i18n';

interface Props {
    lang: Locale;
    posts: Post[];
}

export async function getStaticPaths() {
    const allPosts = await getPosts();

    return LOCALES.map((lang) => {
        const localizedPosts = filterPostsByLocale(allPosts, lang);
        return {
            params: { lang },
            props: {
                lang,
                posts: localizedPosts.map((p) => p.post),
            },
        };
    });
}

const { lang, posts } = Astro.props;
---
```

### 3. 创建动态参数页面

```astro
---
// src/pages/[lang]/category/[slug].astro
import { getPosts } from '@api/ghost/posts';
import { LOCALES, type Locale } from '@lib/i18n';

interface Props {
    lang: Locale;
    post: Post;
}

export async function getStaticPaths() {
    const posts = await getPosts();
    const paths = [];

    for (const lang of LOCALES) {
        for (const post of posts) {
            paths.push({
                params: { lang, slug: post.slug },
                props: { lang, post },
            });
        }
    }

    return paths;
}

const { lang, post } = Astro.props;
---
```

### 4. 创建 RSS 订阅页面

```typescript
// src/pages/[lang]/rss.xml.ts
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts } from '@api/ghost/posts';
import { LOCALES, type Locale, filterPostsByLocale, buildPostPath } from '@lib/i18n';

export async function getStaticPaths() {
    return LOCALES.map((lang) => ({
        params: { lang },
        props: { lang },
    }));
}

export async function GET(context: APIContext) {
    const lang = context.params.lang as Locale;
    const allPosts = await getPosts();
    const localizedPosts = filterPostsByLocale(allPosts, lang);

    return rss({
        title: `Site Title - ${lang}`,
        description: 'Site description',
        site: context.site!,
        items: localizedPosts.map(({ post }) => ({
            title: post.title,
            pubDate: new Date(post.published_at),
            description: post.excerpt,
            link: buildPostPath(lang, post.slug),
        })),
    });
}
```

---

## 📁 相关文件

| 文件                                    | 用途           |
| --------------------------------------- | -------------- |
| `src/layouts/base/BaseLayout.astro`     | 基础布局       |
| `src/lib/i18n.ts`                       | 多语言工具函数 |
| `src/api/ghost/posts.ts`                | Ghost API      |
| `docs/cline/templates/astro-page.astro` | 页面模板       |

---

## 🔧 BaseLayout Props

```typescript
interface BaseLayoutProps {
    siteTitle?: string; // 页面标题
    coverImageUrl?: URL | string | null; // 封面图片
    locale?: Locale; // 当前语言
}
```

---

## 🌐 多语言相关函数

```typescript
import {
    LOCALES, // ['zh', 'ja', 'en']
    type Locale, // 'zh' | 'ja' | 'en'
    DEFAULT_LOCALE, // 'zh'
    LOCALE_NAMES, // { zh: '中文', ja: '日本語', en: 'English' }
    LOCALE_HTML_LANG, // { zh: 'zh-CN', ja: 'ja', en: 'en' }
    filterPostsByLocale, // 过滤多语言文章
    buildPostPath, // 构建文章路径
    buildLocalePath, // 构建语言路径
    getUIText, // 获取 UI 翻译文本
} from '@lib/i18n';
```

---

## ⚠️ 注意事项

1. **环境变量**: 页面使用 Ghost API 时确保 `.env` 已配置
2. **类型生成**: 新页面后运行 `pnpm astro sync`
3. **路由冲突**: 避免静态路由和动态路由冲突
4. **构建测试**: 运行 `pnpm build` 验证静态生成
5. **SEO**: BaseLayout 会自动生成 hreflang 标签

---

## 💡 常见模式

### 重定向到默认语言

```astro
---
// src/pages/index.astro
import { DEFAULT_LOCALE } from '@lib/i18n';

return Astro.redirect(`/${DEFAULT_LOCALE}/`);
---
```

### 404 页面

```astro
---
// src/pages/404.astro
import BaseLayout from '@layouts/base/BaseLayout.astro';
---

<BaseLayout siteTitle="404 - 页面不存在">
    <main class="flex h-screen items-center justify-center">
        <h1 class="text-4xl">404 - 页面不存在</h1>
    </main>
</BaseLayout>
```
