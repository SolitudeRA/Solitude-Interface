# Solitude Interface

![thumbnail](../assets/thumbnail.png)

![Node.js](https://img.shields.io/badge/Node.js-≥18-339933?logo=node.js&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-≥9-F69220?logo=pnpm&logoColor=white)
![Astro](https://img.shields.io/badge/Astro-5.x-BC52EE?logo=astro&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

一个使用 Astro 构建、并由 Ghost CMS Content API 驱动的现代个人博客界面。

**[在线预览](https://www.solitudera.com)** · [文档](../DEVELOPMENT.md)

> **关于本仓库** —— 这是我的个人站点（[solitudera.com](https://www.solitudera.com)）的源码，开源主要用于展示与参考。它**并非按可复用模板来维护**，我也不会主动处理 issue 或 Pull Request。项目采用 MIT 许可，欢迎你随意浏览或 fork。

阅读语言： [English](../../README.md) | 简体中文 | [日本語](README.ja.md)

---

## 目录

- [亮点](#亮点)
- [截图](#截图)
- [技术栈与架构](#技术栈与架构)
- [本地运行](#本地运行)
- [自托管与内容指南](#自托管与内容指南)
- [许可证](#许可证)

---

## 亮点

- **Astro 5 静态站点 + React 群岛** —— 内容在构建期预渲染，交互只在需要处按需水合（`client:idle` / `client:visible` / `client:load`）。
- **类型化的 Ghost CMS 数据层** —— 无头 Ghost Content API 客户端（带重试 + 超时）→ 类型化适配器 → 缓存、分组后的文章，并在外部数据边界做运行时校验。
- **多语言（zh / ja / en）** —— 文章按标签/slug 跨语言分组，提供三级回退；`hreflang`、`canonical` 与逐页 `html lang` 服务 SEO。
- **手工调校的动效** —— 弹簧驱动的文章时间轴，以及视窗最底层的氛围进度条（临界阻尼 rAF 弹簧 + 速度感知光晕），全部遵循 `prefers-reduced-motion`。
- **OKLch 双主题设计系统** —— 明暗 token 定义在感知均匀的色彩空间中，经 Tailwind v4 的 CSS-first `@theme` 接入。
- **为可靠而工程化** —— 严格 TypeScript（`exactOptionalPropertyTypes`）、单元 + 集成测试（Vitest），以及多步 CI（lint / test / typecheck / build）。

架构、代码索引与测试指南见 **[DEVELOPMENT.md](../DEVELOPMENT.md)**。

---

## 截图

<details>
<summary>点击展开截图</summary>

### Home

![Home](../assets/home.png)

### Post

![Post](../assets/post.png)

### About Me

![About-Me](../assets/about-me.png)

### Post Detail

![Post-Detail](../assets/post-detail.png)

</details>

---

## 技术栈与架构

Astro 5（SSG）· React 19 群岛 · Jotai · Tailwind v4 · Ghost CMS（无头）· shiki · motion · TypeScript（严格模式）。

数据单向流动：**Ghost → 类型化客户端 → 适配器 → 缓存文章 → 页面（SSG）→ 表现层组件**。完整说明——项目结构、标签 / i18n 系统、测试策略——见 **[DEVELOPMENT.md](../DEVELOPMENT.md)**。

---

## 本地运行

只想看看代码？最快的方式是用公开的 Ghost Demo API，无需任何账号：

```bash
corepack enable pnpm   # 或：npm i -g pnpm
pnpm install
cp .env.example .env
pnpm dev               # http://localhost:4321
```

随后把 `.env` 指向 Ghost demo：

```env
GHOST_URL=https://demo.ghost.io
GHOST_CONTENT_KEY=22444f78447824223cefc48062
SITE_URL=http://localhost:4321
```

> 常用检查：`pnpm check`（lint + 格式 + 类型检查）与 `pnpm test:run`（单元测试）。完整命令清单见 [DEVELOPMENT.md](../DEVELOPMENT.md)。

---

## 自托管与内容指南

本仓库同时是我站点的真实实现，因此完整的运维配置都在这里——便于你针对自己的 Ghost 实例运行，或了解内容是如何建模的。

<details>
<summary><strong>配置、环境变量、内容发布、多语言与部署</strong></summary>

### 配置环境变量

编辑 `.env`，填写你自己的 Ghost 实例信息：

```env
GHOST_URL=https://your-ghost-instance.com
GHOST_CONTENT_KEY=your-content-api-key-here
GHOST_VERSION=v5.0
GHOST_TIMEOUT=5000
SITE_URL=https://your-site.example.com
IMAGE_HOST_URL=
GOOGLE_ANALYTICS_TAG_ID=
```

#### 必填

| 变量                | 说明                                    |
| ------------------- | --------------------------------------- |
| `GHOST_URL`         | Ghost 实例的基础 URL                    |
| `GHOST_CONTENT_KEY` | Ghost Content API Key                   |
| `SITE_URL`          | 站点公开 URL（canonical / hreflang 用） |

#### 可选

| 变量                      | 默认值 | 说明                                                                   |
| ------------------------- | ------ | ---------------------------------------------------------------------- |
| `GHOST_VERSION`           | `v5.0` | Ghost Content API 版本                                                 |
| `GHOST_TIMEOUT`           | `5000` | Ghost 请求超时时间（毫秒）                                             |
| `IMAGE_HOST_URL`          | -      | 图片域名/CDN，用于远程图片域名白名单；支持单个或逗号分隔的多个 URL     |
| `GOOGLE_ANALYTICS_TAG_ID` | -      | Google tag / GA4 Measurement ID（如 `G-XXXX`）。留空即可关闭统计       |
| `CF_ACCESS_CLIENT_ID`     | -      | Cloudflare Access Service Token Client ID（Ghost 被 CF Access 保护时） |
| `CF_ACCESS_CLIENT_SECRET` | -      | Cloudflare Access Service Token Client Secret                          |

#### 获取 Ghost Content API Key

1. 登录 Ghost Admin 后台
2. 进入 **Settings** → **Integrations**
3. 点击 **Add custom integration**
4. 将 **Content API Key** 填写到 `.env` 中

### Cloudflare Access（可选）

如果你的 Ghost 实例被 [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/) 保护，需要配置 **Service Token** 才能访问 API：

1. **创建 Service Token**（在 Cloudflare Zero Trust 后台）：进入 **Access** → **Service Auth** → **Service Tokens** → **Create Service Token**，复制 **Client ID** 与 **Client Secret**。
2. **写入 `.env`**，对应 `CF_ACCESS_CLIENT_ID` / `CF_ACCESS_CLIENT_SECRET`。
3. **在对应 Access Application 中添加 Service Auth 策略**并选中该 token。

> **说明**：本项目只实现 **Service Token** 认证 —— 当两个变量**成对设置**时，才会附带 `CF-Access-Client-Id` / `CF-Access-Client-Secret` 头（只设其一则都不发送，并打印告警）。

以下是 **Cloudflare 面板侧的策略，本项目代码并不实现、也不读取** —— 它们只是放行 Content API 请求，仅在你额外加了防护时才需要：

- **Bot Fight Mode**：Cloudflare → Security → WAF → Custom rules，新建规则：URI Path `starts with` `/ghost/api/content/`，Action = Skip → 勾选 All Super Bot Fight Mode rules。
- **Zero Trust Access Bypass**：Zero Trust → Access → Applications，为 `your-ghost-domain.com/ghost/api/content/*` 添加应用，策略设为 **Bypass**。

### 内容发布

使用 **普通标签（regular tags）** 对文章进行分类。系统会识别带特殊前缀的标签：

| 标签前缀    | 用途         | 示例                                                       |
| ----------- | ------------ | ---------------------------------------------------------- |
| `type-`     | 文章展示类型 | `type-article`, `type-gallery`, `type-video`, `type-music` |
| `category-` | 内容分类     | `category-tech`, `category-life`, `category-design`        |
| `series-`   | 系列文章     | `series-astro-tutorial`, `series-web-dev-basics`           |
| _(无前缀)_  | 普通标签     | `JavaScript`, `React`, `Photography`                       |

| Type 标签      | 展示样式         |
| -------------- | ---------------- |
| `type-article` | 标准文章布局     |
| `type-gallery` | 带轮播的图片画廊 |
| `type-video`   | 视频播放器嵌入   |
| `type-music`   | 音频播放器嵌入   |
| _(默认)_       | 默认卡片布局     |

### 多语言内容

| 路由           | 说明                   |
| -------------- | ---------------------- |
| `/`            | 自动跳转到用户偏好语言 |
| `/zh/`         | 中文文章列表           |
| `/ja/`         | 日文文章列表           |
| `/en/`         | 英文文章列表           |
| `/zh/p/{key}/` | 中文文章详情           |
| `/ja/p/{key}/` | 日文文章详情           |
| `/en/p/{key}/` | 英文文章详情           |

在 Ghost 中使用 **内部标签（internal tags，以 `#` 开头）**：

| 内部标签         | 用途                                   | 示例                               |
| ---------------- | -------------------------------------- | ---------------------------------- |
| `#lang-{locale}` | 指定文章语言                           | `#lang-zh`, `#lang-ja`, `#lang-en` |
| `#i18n-{key}`    | 翻译分组标识（同一文章的不同语言版本） | `#i18n-intro-to-solitude`          |

> **注意**：在 Ghost Content API 中，内部标签 `#xxx` 会被转换为 slug 形式 `hash-xxx`。

**文章 slug 命名约定（保留前缀）** —— 除内部标签外，系统还支持直接从 **Ghost post slug** 派生文章身份，约定为 `{locale}-{key}`：

| Post slug         | 解析结果                                                          |
| ----------------- | ----------------------------------------------------------------- |
| `ja-homeserver-8` | locale = `ja`，翻译组 key = `homeserver-8` → `/ja/p/homeserver-8` |
| `en-blog-project` | locale = `en`，翻译组 key = `blog-project` → `/en/p/blog-project` |

> **重要：`zh-` / `ja-` / `en-` 是保留的 slug 前缀。** 任何以合法语言代码加连字符开头的 slug，都会被当作该语言的多语言文章来解析（即使没有 `#lang-*` / `#i18n-*` 标签）。因此**不要给普通（非多语言）文章起 `zh-…` / `ja-…` / `en-…` 这样的 slug**，否则它会被误并入翻译组、生成错误的 `/{locale}/p/{key}` 路由与 hreflang。当文章同时带 `#lang-*` 标签时：**语言**以标签为准、slug 前缀仅作回退；**翻译组 key** 则优先取自 slug，`#i18n-*` 标签作为回退。

**创建多语言文章** —— 每种语言版本在 Ghost 中都是一篇**独立的 Post**，通过相同的 `#i18n-{key}` 标签关联：

1. 选定翻译分组 key（如 `astro-guide`）—— 它用于 `#i18n-astro-guide` 标签与 URL `/{locale}/p/astro-guide`。
2. 创建中文版本：撰写内容，添加标签 `#lang-zh` 与 `#i18n-astro-guide`（可选 `type-article`、`category-tech`），发布。
3. 创建日文版本（另一篇独立文章）：标签 `#lang-ja` 与**相同的** `#i18n-astro-guide`，发布。
4. 创建英文版本（另一篇独立文章）：标签 `#lang-en` 与**相同的** `#i18n-astro-guide`，发布。

三篇文章即对应 `/zh/p/astro-guide`、`/ja/p/astro-guide`、`/en/p/astro-guide`，可通过文章页的语言切换器互相切换。

| 文章标题                             | Tags                                                             |
| ------------------------------------ | ---------------------------------------------------------------- |
| “Astro 入门指南”（中文）             | `#lang-zh`, `#i18n-astro-guide`, `type-article`, `category-tech` |
| “Astro入門ガイド”（日文）            | `#lang-ja`, `#i18n-astro-guide`, `type-article`, `category-tech` |
| “Getting Started with Astro”（英文） | `#lang-en`, `#i18n-astro-guide`, `type-article`, `category-tech` |

**回退（Fallback）**：若某语言版本不存在，则展示默认语言（中文）；若默认语言也不存在，则按 `LOCALES` 顺序（`zh`、`ja`、`en`）取任意可用变体——该顺序是 load-bearing 的（中文缺失时日文优先于英文）。页面会显示提示横幅说明发生了回退。

### 部署

这是纯静态站点（Astro SSG）—— `pnpm build` 产物输出到 `dist/`，可托管到任意静态主机（如 Cloudflare Pages）。请在部署平台的构建环境中配置与本地 `.env` 相同的环境变量：静态生成发生在**构建期**，Ghost 内容在构建时抓取并预渲染，凭据不会进入 `dist/`。

</details>

---

## 许可证

MIT —— 见 [LICENSE](../../LICENSE)。欢迎 fork 与改造。
