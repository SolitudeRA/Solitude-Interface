# Solitude Interface

![thumbnail](../assets/thumbnail.png)

![Node.js](https://img.shields.io/badge/Node.js-≥18-339933?logo=node.js&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-≥9-F69220?logo=pnpm&logoColor=white)
![Astro](https://img.shields.io/badge/Astro-5.x-BC52EE?logo=astro&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

一个使用 Astro 构建、并由 Ghost CMS Content API 驱动的现代个人博客界面。

阅读语言： [English](../../README.md) | 简体中文 | [日本語](README.ja.md)

## 🚀 功能特性

- 使用 Astro 构建的高性能静态站点
- Ghost CMS 集成（Headless）
- 支持 **多语言（zh/ja/en）**，并提供自动回退（fallback）
- 响应式设计，支持深色/浅色主题切换
- 多种文章展示类型（文章、画廊、视频、音乐）
- SEO 优化（hreflang、canonical、html lang）

## Screenshots

### Home

![Home](../assets/home.png)

### Post

![Post](../assets/post.png)

### About Me

![About-Me](../assets/about-me.png)

### Post Detail

![Post-Detail](../assets/post-detail.png)

## 📖 文档

| 文档                                    | 说明                                                               |
| --------------------------------------- | ------------------------------------------------------------------ |
| **README.md**（英文）                   | 使用指南 - 安装配置与内容发布： [../../README.md](../../README.md) |
| [**DEVELOPMENT.md**](../DEVELOPMENT.md) | 开发者指南 - 架构、测试、工作流与贡献说明                          |

---

## 🚀 快速开始

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
| `IMAGE_HOST_URL`          | 否   | 可选：图片域名/CDN，用于远程图片域名白名单（默认：空）                                    |
| `GOOGLE_ANALYTICS_TAG_ID` | 否   | 可选：Google tag / GA4 Measurement ID（如 `G-XXXX`）。留空即可关闭统计                    |
| `CF_ACCESS_CLIENT_ID`     | 否   | Cloudflare Access Service Token Client ID（仅当 Ghost 使用 Cloudflare Access 保护时需要） |
| `CF_ACCESS_CLIENT_SECRET` | 否   | Cloudflare Access Service Token Client Secret                                             |

### Cloudflare 配置（可选）

如果你的 Ghost 实例使用 Cloudflare 保护，可能需要额外配置：

#### Bot Fight Mode

创建 WAF 自定义规则跳过 API 的机器人保护：

1. Cloudflare Dashboard → **Security** → **WAF** → **Custom rules**
2. 创建规则：URI Path `starts with` `/ghost/api/content/`
3. Action: **Skip** → 勾选 "All Super Bot Fight Mode rules"

#### Zero Trust Access

如果使用 Cloudflare Zero Trust Access：

1. Zero Trust Dashboard → **Access** → **Applications**
2. 为 `your-ghost-domain.com/ghost/api/content/*` 添加应用
3. 策略设置为 **Bypass**

或使用 Service Auth Token：

1. Zero Trust → **Access** → **Service Auth** → 创建 Service Token
2. 将 Client ID 和 Secret 添加到 `.env` 文件

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

## 常用命令

| 命令               | 说明                                    |
| ------------------ | --------------------------------------- |
| `pnpm dev`         | 启动开发服务器                          |
| `pnpm build`       | 构建生产环境产物                        |
| `pnpm preview`     | 预览生产构建结果                        |
| `pnpm astro sync`  | 生成类型定义（env/schema 修改后很有用） |
| `pnpm astro check` | 类型检查并验证 Astro 项目               |
| `pnpm test`        | 运行测试                                |
| `pnpm format`      | 格式化代码                              |

---

## 📝 内容发布指南

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

## 🌐 多语言内容

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

### 步骤：创建多语言文章

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

### 回退（Fallback）行为

- 若某语言版本不存在，则展示默认语言（中文）
- 页面会显示提示横幅，说明发生了回退
- 语言切换器会标识哪些语言版本可用/不可用

---

## 🛠️ 给开发者

请查看 [**docs/DEVELOPMENT.md**](../DEVELOPMENT.md)，包含：

- 🔧 技术栈与项目结构
- 🧞 可用命令说明
- 📋 测试指南（单元测试 & 集成测试）
- 🏗️ 架构说明与代码参考

---

## 📄 许可证

本项目为开源项目，使用 [MIT License](../../LICENSE)。
