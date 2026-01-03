# Solitude Interface

![thumbnail](docs/assets/thumbnail.png)

使用 Astro 构建、由 Ghost CMS API 驱动的现代个人博客界面。

阅读语言: [English](../../README.md) | 简体中文 | [日本語](README.ja.md)

## 功能

- 基于 Astro 的高性能静态站点
- Ghost CMS 无头集成
- **多语言支持（zh/ja/en）**，自动回退
- 响应式设计，暗色/亮色主题切换
- 多种文章展示类型（文章、画廊、视频、音乐）
- SEO 优化（hreflang、canonical、html lang）

## 截图
### Home
![Home](docs/assets/home.png)
### Post
![Post](docs/assets/post.png)
### About Me
![About-Me](docs/assets/about-me.png)
### Post Detail
![Post-Detail](docs/assets/post-detail.png)

## 文档

| 文档 | 说明 |
|------|------|
| **README.zh.md**（本文件） | 使用指南 - 配置与内容发布 |
| [**DEVELOPMENT.md**](../DEVELOPMENT.md) | 开发指南 - 架构、测试、命令 |

---

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境

从模板创建 `.env` 文件:

```bash
cp .env.example .env
```

编辑 `.env` 填写 Ghost 实例信息:

```env
GHOST_URL=https://your-ghost-instance.com
GHOST_CONTENT_KEY=your-content-api-key-here
GHOST_VERSION=v5.0
SITE_URL=https://your-site.example.com
```

#### 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `GHOST_URL` | 是 | Ghost 实例基础 URL |
| `GHOST_CONTENT_KEY` | 是 | Ghost Content API Key |
| `GHOST_VERSION` | 是 | Ghost Content API 版本（如 `v5.0`） |
| `SITE_URL` | 是 | 站点公开地址，用于 canonical 与 hreflang |

### 3. 获取 Ghost Content API Key

1. 登录 Ghost 管理后台
2. 进入 **Settings** -> **Integrations**
3. 点击 **Add custom integration**
4. 将 **Content API Key** 复制到 `.env`

> **提示**：可使用 Ghost Demo API 测试:
> ```env
> GHOST_URL=https://demo.ghost.io
> GHOST_CONTENT_KEY=22444f78447824223cefc48062
> ```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:4321` 查看站点。

## 常用命令

| 命令 | 说明 |
|---------|-------------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产站点 |
| `npm run preview` | 预览生产构建 |
| `npm run test` | 运行测试 |
| `npm run format` | 格式化代码 |

---

## 内容发布指南

### 分类标签

使用 **普通标签** 对文章进行分类。系统识别以下前缀:

| 标签前缀 | 用途 | 示例 |
|------------|---------|---------|
| `type-` | 文章展示类型 | `type-article`, `type-gallery`, `type-video`, `type-music` |
| `category-` | 内容分类 | `category-tech`, `category-life`, `category-design` |
| `series-` | 系列文章 | `series-astro-tutorial`, `series-web-dev-basics` |
| *(无前缀)* | 通用标签 | `JavaScript`, `React`, `Photography` |

#### 支持的文章类型

| 类型标签 | 展示样式 |
|----------|---------------|
| `type-article` | 标准文章布局 |
| `type-gallery` | 含轮播的图片画廊 |
| `type-video` | 视频播放器嵌入 |
| `type-music` | 音频播放器嵌入 |
| *(默认)* | 默认卡片布局 |

---

## 多语言内容

### URL 结构

| 路由 | 说明 |
| -------------- | ------------------------------------------- |
| `/` | 自动跳转到用户首选语言 |
| `/zh/` | 中文列表 |
| `/ja/` | 日文列表 |
| `/en/` | 英文列表 |
| `/zh/p/{key}/` | 中文文章 |
| `/ja/p/{key}/` | 日文文章 |
| `/en/p/{key}/` | 英文文章 |

### 多语言所需标签

在 Ghost 中使用 **内部标签**（以 `#` 开头）:

| 内部标签 | 用途 | 示例 |
|--------------|---------|---------|
| `#lang-{locale}` | 指定语言 | `#lang-zh`, `#lang-ja`, `#lang-en` |
| `#i18n-{key}` | 翻译分组标识 | `#i18n-intro-to-solitude` |

> **注意**: 在 Ghost Content API 中，内部标签 `#xxx` 会被转换为 slug 格式 `hash-xxx`。

### 步骤：创建多语言文章

**重要**：每种语言版本都是 Ghost 中的 **独立文章**，通过相同的 `#i18n-{key}` 关联。

#### 步骤 1：规划翻译分组 key

选择一个唯一 key，例如 `astro-guide`。此 key 将用于:
- `#i18n-astro-guide` 标签
- URL: `/zh/p/astro-guide`, `/ja/p/astro-guide`, `/en/p/astro-guide`

#### 步骤 2：创建中文版本

在 Ghost 后台新建文章:
1. 使用中文撰写内容
2. 打开文章设置（齿轮图标）
3. 滚动到 **Tags** 区域
4. 添加标签:
   - `#lang-zh`（语言标签）
   - `#i18n-astro-guide`（翻译分组）
   - `type-article`（可选：展示类型）
   - `category-tech`（可选：分类）
5. 发布文章

#### 步骤 3：创建日文版本

创建 **新的独立文章**:
1. 使用日文撰写内容
2. 添加标签:
   - `#lang-ja`（不同语言）
   - `#i18n-astro-guide`（相同 key）
   - `type-article`, `category-tech`（与中文一致）
3. 发布文章

#### 步骤 4：创建英文版本

创建另一篇 **新的独立文章**:
1. 使用英文撰写内容
2. 添加标签:
   - `#lang-en`（不同语言）
   - `#i18n-astro-guide`（相同 key）
   - `type-article`, `category-tech`（与其他版本一致）
3. 发布文章

#### 结果

现在你将拥有 3 篇独立文章，使用 `#i18n-astro-guide` 关联:
- 中文文章 -> `/zh/p/astro-guide`
- 日文文章 -> `/ja/p/astro-guide`
- 英文文章 -> `/en/p/astro-guide`

用户可在文章页的语言切换器中切换版本。

### 完整示例

| 文章标题 | 标签 |
|------------|------|
| "Astro 入门指南"（中文） | `#lang-zh`, `#i18n-astro-guide`, `type-article`, `category-tech` |
| "Astro入門ガイド"（日文） | `#lang-ja`, `#i18n-astro-guide`, `type-article`, `category-tech` |
| "Getting Started with Astro"（英文） | `#lang-en`, `#i18n-astro-guide`, `type-article`, `category-tech` |

### 回退行为

- 如果目标语言不存在，将显示默认语言（中文）
- 会显示回退提示条
- 语言切换器显示可用/不可用版本

---

## 面向开发者

查看 [**DEVELOPMENT.md**](../DEVELOPMENT.md) 了解:

- 技术栈与项目结构
- 可用命令
- 测试指南（单元与集成）
- 架构与代码参考

---

## 许可证

本项目采用 [MIT License](LICENSE) 开源许可。
