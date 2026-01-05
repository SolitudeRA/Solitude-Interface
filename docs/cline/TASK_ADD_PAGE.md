# 任务上下文: 添加新页面

## 📋 任务类型

创建新的 Astro 页面路由

## 🎯 快速参考

### 页面放置位置

```
src/pages/
├── index.astro              # 首页 (重定向到默认语言)
├── contact.astro            # 无多语言的静态页面
└── [lang]/                  # 多语言动态路由
    ├── index.astro          # /{lang}/ 首页
    ├── about.astro          # /{lang}/about
    ├── post-view.astro      # /{lang}/post-view
    ├── privacy-policy.astro # /{lang}/privacy-policy
    └── p/
        └── [key].astro      # /{lang}/p/{key} 文章详情
```

### URL 路由规则

| 文件路径                      | URL                             |
| ----------------------------- | ------------------------------- |
| `pages/foo.astro`             | `/foo`                          |
| `pages/[lang]/foo.astro`      | `/zh/foo`, `/ja/foo`, `/en/foo` |
| `pages/[lang]/bar/[id].astro` | `/zh/bar/123`                   |

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
---

<BaseLayout lang={lang}>
    <main>
        <!-- 页面内容 -->
    </main>
</BaseLayout>
```

### 2. 获取 Ghost 数据 (可选)

```astro
---
import { getPosts } from '@api/ghost/posts';
import { filterPostsByLocale } from '@lib/i18n';

export async function getStaticPaths() {
    const allPosts = await getPosts();

    return LOCALES.map((lang) => {
        const localizedPosts = filterPostsByLocale(allPosts, lang);
        return {
            params: { lang },
            props: { lang, posts: localizedPosts },
        };
    });
}
---
```

### 3. 创建动态参数页面

```astro
---
// src/pages/[lang]/category/[slug].astro
import { getPosts } from '@api/ghost/posts';
import { LOCALES } from '@lib/i18n';

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
---
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

## 🔧 SEO 配置

### 添加 meta 标签

```astro
<BaseLayout lang={lang} title="页面标题" description="页面描述" />
```

### 多语言 hreflang (自动处理)

BaseLayout 会自动生成 hreflang 标签。

---

## ⚠️ 注意事项

1. **环境变量**: 页面使用 Ghost API 时确保 `.env` 已配置
2. **类型生成**: 新页面后运行 `pnpm astro sync`
3. **路由冲突**: 避免静态路由和动态路由冲突
4. **构建测试**: 运行 `pnpm build` 验证静态生成
