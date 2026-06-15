# Solitude Interface

![thumbnail](../assets/thumbnail.png)

![Node.js](https://img.shields.io/badge/Node.js-≥18-339933?logo=node.js&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-≥9-F69220?logo=pnpm&logoColor=white)
![Astro](https://img.shields.io/badge/Astro-5.x-BC52EE?logo=astro&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

一个使用 Astro 构建、并由 Ghost CMS Content API 驱动的现代个人博客界面。

**[在线预览](https://www.solitudera.com)** · [文档](../DEVELOPMENT.md) · [反馈问题](https://github.com/SolitudeRA/Solitude-Interface/issues)

阅读语言： [English](../../README.md) | 简体中文 | [日本語](README.ja.md)

---

## 目录

- [功能特性](#功能特性)
- [截图](#截图)
- [文档](#文档)
- [快速开始](#快速开始)
- [常用命令](#常用命令)
- [内容发布指南](#内容发布指南)
- [多语言内容](#多语言内容)
- [给开发者](#给开发者)
- [支持](#支持)
- [致谢](#致谢)
- [许可证](#许可证)

---

## 功能特性

- 使用 Astro 构建的高性能静态站点
- Ghost CMS 集成（Headless）
- 支持 **多语言（zh/ja/en）**，并提供自动回退（fallback）
- 响应式设计，支持深色/浅色主题切换
- 多种文章展示类型（文章、画廊、视频、音乐）
- SEO 优化（hreflang、canonical、html lang）

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

## 文档

| 文档                                    | 说明                                                               |
| --------------------------------------- | ------------------------------------------------------------------ |
| **README.md**（英文）                   | 使用指南 - 安装配置与内容发布： [../../README.md](../../README.md) |
| [**DEVELOPMENT.md**](../DEVELOPMENT.md) | 开发者指南 - 架构、测试、工作流与贡献说明                          |

---

## 快速开始

### 1. 安装依赖

本项目使用 **pnpm**。

```bash
#（推荐）通过 Corepack 启用 pnpm
corepack enable pnpm

pnpm install
```

> 如果你的系统中没有 `corepack`，也可以通过 `npm i -g pnpm` 全局安装 pnpm。

### 2. 配置环境变量

从模板创建 `.env` 文件：

```bash
cp .env.example .env
```

编辑 `.env`，填写你的 Ghost 实例信息：

```env
GHOST_URL=https://your-ghost-instance.com
GHOST_CONTENT_KEY=your-content-api-key-here
GHOST_VERSION=v5.0
GHOST_TIMEOUT=5000
SITE_URL=https://your-site.example.com
IMAGE_HOST_URL=
GOOGLE_ANALYTICS_TAG_ID=
```

#### 环境变量说明

| 变量                      | 必填 | 说明                                                                                      |
| ------------------------- | ---- | ----------------------------------------------------------------------------------------- |
| `GHOST_URL`               | 是   | Ghost 实例的基础 URL                                                                      |
| `GHOST_CONTENT_KEY`       | 是   | Ghost Content API Key                                                                     |
| `GHOST_VERSION`           | 否   | Ghost Content API 版本（默认：`v5.0`）                                                    |
| `GHOST_TIMEOUT`           | 否   | Ghost 请求超时时间（毫秒，默认：`5000`）                                                  |
| `SITE_URL`                | 是   | 站点公开 URL（用于 canonical / hreflang）                                                 |
| `IMAGE_HOST_URL`          | 否   | 可选：图片域名/CDN，用于远程图片域名白名单；支持单个或逗号分隔的多个 URL（默认：空）      |
| `GOOGLE_ANALYTICS_TAG_ID` | 否   | 可选：Google tag / GA4 Measurement ID（如 `G-XXXX`）。留空即可关闭统计                    |
| `CF_ACCESS_CLIENT_ID`     | 否   | Cloudflare Access Service Token Client ID（仅当 Ghost 使用 Cloudflare Access 保护时需要） |
| `CF_ACCESS_CLIENT_SECRET` | 否   | Cloudflare Access Service Token Client Secret                                             |

### Cloudflare Access 配置（可选）

如果你的 Ghost 实例被 [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/) 保护，需要配置 Service Token 才能访问 API：

1. **创建 Service Token**（在 Cloudflare Zero Trust 后台）：
    - 进入 **Access** → **Service Auth** → **Service Tokens**
    - 点击 **Create Service Token**
    - 复制 **Client ID** 与 **Client Secret**

2. **写入 `.env`**：

    ```env
    CF_ACCESS_CLIENT_ID=your-client-id.access
    CF_ACCESS_CLIENT_SECRET=your-client-secret
    ```

3. **在对应 Access Application 中添加放行策略**：
    - 进入 **Access** → **Applications** → 你的 Ghost App
    - 添加一条 **Action: Service Auth** 策略并选中该 token

> **说明**：本项目只实现 **Service Token** 认证 —— 当两个变量**成对设置**时，API 客户端会自动附带 `CF-Access-Client-Id` / `CF-Access-Client-Secret` 头（只设其一则都不会发送，并打印告警）。

#### 可选：面板侧放行规则

以下是 **Cloudflare 面板侧的策略，本项目代码并不实现、也不读取** —— 它们只是放行 Content API 请求，仅在你额外加了防护时才需要：

- **Bot Fight Mode**：Cloudflare → Security → WAF → Custom rules，新建规则：URI Path `starts with` `/ghost/api/content/`，Action = Skip → 勾选 All Super Bot Fight Mode rules。
- **Zero Trust Access Bypass**：Zero Trust → Access → Applications，为 `your-ghost-domain.com/ghost/api/content/*` 添加应用，策略设为 **Bypass**。

### 3. 获取 Ghost Content API Key

1. 登录 Ghost Admin 后台
2. 进入 **Settings** → **Integrations**
3. 点击 **Add custom integration**
4. 将 **Content API Key** 填写到 `.env` 中

> **Tip**：你也可以用 Ghost 的 Demo API 做测试：
>
> ```env
> GHOST_URL=https://demo.ghost.io
> GHOST_CONTENT_KEY=22444f78447824223cefc48062
> ```

### 4. 启动开发服务器

```bash
pnpm dev
```

访问 `http://localhost:4321` 查看站点。

> **部署**：这是纯静态站点（Astro SSG）—— `pnpm build` 产物输出到 `dist/`，可托管到任意静态主机（如 Cloudflare Pages）。请在部署平台的构建环境中配置与本地 `.env` 相同的环境变量：静态生成发生在**构建期**，Ghost 内容在构建时抓取并预渲染，凭据不会进入 `dist/`。

---

## 常用命令

| 命令              | 说明                                      |
| ----------------- | ----------------------------------------- |
| `pnpm dev`        | 启动开发服务器                            |
| `pnpm build`      | 构建生产环境产物                          |
| `pnpm preview`    | 预览生产构建结果                          |
| `pnpm astro sync` | 生成类型定义（env/schema 修改后很有用）   |
| `pnpm check`      | Lint + 格式检查 + 类型检查（提交前运行）  |
| `pnpm test:run`   | 运行一次测试（`pnpm test` 为 watch 模式） |
| `pnpm format`     | 格式化代码                                |

---

## 内容发布指南

### 分类标签（Tags）

使用 **普通标签（regular tags）** 对文章进行分类。系统会识别带特殊前缀的标签：

| 标签前缀    | 用途         | 示例                                                       |
| ----------- | ------------ | ---------------------------------------------------------- |
| `type-`     | 文章展示类型 | `type-article`, `type-gallery`, `type-video`, `type-music` |
| `category-` | 内容分类     | `category-tech`, `category-life`, `category-design`        |
| `series-`   | 系列文章     | `series-astro-tutorial`, `series-web-dev-basics`           |
| _(无前缀)_  | 普通标签     | `JavaScript`, `React`, `Photography`                       |

#### 支持的文章类型

| Type 标签      | 展示样式         |
| -------------- | ---------------- |
| `type-article` | 标准文章布局     |
| `type-gallery` | 带轮播的图片画廊 |
| `type-video`   | 视频播放器嵌入   |
| `type-music`   | 音频播放器嵌入   |
| _(默认)_       | 默认卡片布局     |

---

## 多语言内容

### URL 结构

| 路由           | 说明                   |
| -------------- | ---------------------- |
| `/`            | 自动跳转到用户偏好语言 |
| `/zh/`         | 中文文章列表           |
| `/ja/`         | 日文文章列表           |
| `/en/`         | 英文文章列表           |
| `/zh/p/{key}/` | 中文文章详情           |
| `/ja/p/{key}/` | 日文文章详情           |
| `/en/p/{key}/` | 英文文章详情           |

### 多语言必需标签

在 Ghost 中使用 **内部标签（internal tags，以 `#` 开头）**：

| 内部标签         | 用途                                   | 示例                               |
| ---------------- | -------------------------------------- | ---------------------------------- |
| `#lang-{locale}` | 指定文章语言                           | `#lang-zh`, `#lang-ja`, `#lang-en` |
| `#i18n-{key}`    | 翻译分组标识（同一文章的不同语言版本） | `#i18n-intro-to-solitude`          |

> **注意**：在 Ghost Content API 中，内部标签 `#xxx` 会被转换为 slug 形式 `hash-xxx`。

### 文章 slug 命名约定（保留前缀）

除内部标签外，系统还支持直接从 **Ghost post slug** 派生文章身份，约定为 `{locale}-{key}`：

| Post slug         | 解析结果                                                          |
| ----------------- | ----------------------------------------------------------------- |
| `ja-homeserver-8` | locale = `ja`，翻译组 key = `homeserver-8` → `/ja/p/homeserver-8` |
| `en-blog-project` | locale = `en`，翻译组 key = `blog-project` → `/en/p/blog-project` |

> **重要：`zh-` / `ja-` / `en-` 是保留的 slug 前缀。** 任何以合法语言代码加连字符开头的 slug，都会被当作该语言的多语言文章来解析（即使没有 `#lang-*` / `#i18n-*` 标签）。
>
> 因此**不要给普通（非多语言）文章起 `zh-…` / `ja-…` / `en-…` 这样的 slug**，否则它会被误并入翻译组、生成错误的 `/{locale}/p/{key}` 路由与 hreflang。普通文章请使用不以语言代码开头的 slug。
>
> 当文章同时带 `#lang-*` 标签时：**语言**以标签为准、slug 前缀仅作回退；**翻译组 key** 则优先取自 slug，`#i18n-*` 标签作为回退。

<details>
<summary><strong>分步指南：创建多语言文章</strong></summary>

**重要**：每种语言版本在 Ghost 中都是一篇**独立的 Post**。它们通过相同的 `#i18n-{key}` 标签关联在一起。

#### Step 1：规划翻译分组 key

为文章选择一个唯一 key，例如 `astro-guide`。这个 key 会用于：

- `#i18n-astro-guide` 标签（将各语言版本关联起来）
- URL：`/zh/p/astro-guide`、`/ja/p/astro-guide`、`/en/p/astro-guide`

#### Step 2：创建中文版本

在 Ghost Admin 中创建新文章：

1. 用中文撰写内容
2. 打开 **Post settings**（齿轮图标）
3. 滚动到 **Tags**
4. 添加标签：
    - `#lang-zh`（语言标签，注意 `#` 前缀）
    - `#i18n-astro-guide`（翻译分组标签）
    - `type-article`（可选：文章类型）
    - `category-tech`（可选：分类）
5. 发布文章

#### Step 3：创建日文版本

在 Ghost 中创建 **另一篇新的、独立的文章**：

1. 用日文撰写内容
2. 添加标签：
    - `#lang-ja` ← 不同语言
    - `#i18n-astro-guide` ← **相同** i18n key！
    - `type-article`, `category-tech`（与中文一致）
3. 发布文章

#### Step 4：创建英文版本

再创建一篇 **新的、独立的文章**：

1. 用英文撰写内容
2. 添加标签：
    - `#lang-en` ← 不同语言
    - `#i18n-astro-guide` ← **相同** i18n key！
    - `type-article`, `category-tech`（与其他版本一致）
3. 发布文章

#### 结果

现在你在 Ghost 里有 3 篇独立文章，通过 `#i18n-astro-guide` 关联：

- 中文：`/zh/p/astro-guide`
- 日文：`/ja/p/astro-guide`
- 英文：`/en/p/astro-guide`

用户可以通过文章页面的语言切换器在不同语言版本之间切换。

### 完整示例

| 文章标题                             | Tags                                                             |
| ------------------------------------ | ---------------------------------------------------------------- |
| “Astro 入门指南”（中文）             | `#lang-zh`, `#i18n-astro-guide`, `type-article`, `category-tech` |
| “Astro入門ガイド”（日文）            | `#lang-ja`, `#i18n-astro-guide`, `type-article`, `category-tech` |
| “Getting Started with Astro”（英文） | `#lang-en`, `#i18n-astro-guide`, `type-article`, `category-tech` |

</details>

### 回退（Fallback）行为

- 若某语言版本不存在，则展示默认语言（中文）
- 若默认语言也不存在，则按 `LOCALES` 顺序（`zh`、`ja`、`en`）取任意可用变体——该顺序是 load-bearing 的（例如中文缺失时，日文优先于英文）
- 页面会显示提示横幅，说明发生了回退
- 语言切换器会标识哪些语言版本可用/不可用

---

## 给开发者

请查看 [**docs/DEVELOPMENT.md**](../DEVELOPMENT.md)，包含：

- 技术栈与项目结构
- 可用命令说明
- 测试指南（单元测试 & 集成测试）
- 架构说明与代码参考

### 贡献

欢迎贡献！请提交 Pull Request。重大改动请先开 issue 讨论你想做的改动。

---

## 支持

有问题、想法或 Bug？请到 [GitHub Issues](https://github.com/SolitudeRA/Solitude-Interface/issues) 反馈。

---

## 致谢

- [Astro](https://astro.build/) - 面向内容驱动型网站的 Web 框架
- [Ghost](https://ghost.org/) - 专业的内容发布平台
- [TailwindCSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [React](https://react.dev/) - 用于构建用户界面的库

---

## 许可证

本项目为开源项目，使用 [MIT License](../../LICENSE)。
