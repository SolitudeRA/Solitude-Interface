# Solitude Interface

![thumbnail](docs/assets/thumbnail.png)

![Node.js](https://img.shields.io/badge/Node.js-≥18-339933?logo=node.js&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-≥9-F69220?logo=pnpm&logoColor=white)
![Astro](https://img.shields.io/badge/Astro-5.x-BC52EE?logo=astro&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

A modern personal blog interface built with Astro and powered by Ghost CMS API.

Read this in: English | [简体中文](docs/i18n/README.zh.md) | [日本語](docs/i18n/README.ja.md)

## 🚀 Features

- High-performance static site built with Astro
- Ghost CMS integration (Headless)
- **Multi-language support (zh/ja/en)** with automatic fallback
- Responsive design with dark/light theme toggle
- Multiple post type displays (articles, gallery, video, music)
- SEO optimized (hreflang, canonical, html lang)

## Screenshots

### Home

![Home](docs/assets/home.png)

### Post

![Post](docs/assets/post.png)

### About Me

![About-Me](docs/assets/about-me.png)

### Post Detail

![Post-Detail](docs/assets/post-detail.png)

## 📖 Documentation

| Document                                  | Description                                                          |
| ----------------------------------------- | -------------------------------------------------------------------- |
| **README.md** (this file)                 | User guide - setup and content publishing                            |
| [**DEVELOPMENT.md**](docs/DEVELOPMENT.md) | Developer guide - architecture, testing, workflows, and contributing |

---

## 🚀 Quick Start

### 1. Install Dependencies

This project uses **pnpm**.

```bash
# (Recommended) Enable pnpm via Corepack
corepack enable pnpm

pnpm install
```

> If `corepack` is not available on your system, you can install pnpm globally with `npm i -g pnpm`.

### 2. Configure Environment

Create a `.env` file from the template:

```bash
cp .env.example .env
```

Edit `.env` with your Ghost instance information:

```env
GHOST_URL=https://your-ghost-instance.com
GHOST_CONTENT_KEY=your-content-api-key-here
GHOST_VERSION=v5.0
GHOST_TIMEOUT=5000
SITE_URL=https://your-site.example.com
IMAGE_HOST_URL=
GOOGLE_ANALYTICS_TAG_ID=
```

#### Environment Variables

| Variable                  | Required | Description                                                                                 |
| ------------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `GHOST_URL`               | Yes      | Base URL of your Ghost instance                                                             |
| `GHOST_CONTENT_KEY`       | Yes      | Ghost Content API key                                                                       |
| `GHOST_VERSION`           | No       | Ghost Content API version (default: `v5.0`)                                                 |
| `GHOST_TIMEOUT`           | No       | Ghost request timeout in milliseconds (default: `5000`)                                     |
| `SITE_URL`                | Yes      | Public site URL for canonical and hreflang                                                  |
| `IMAGE_HOST_URL`          | No       | Optional image host/CDN used for remote image domain allowlist (default: empty)             |
| `GOOGLE_ANALYTICS_TAG_ID` | No       | Optional Google tag / GA4 Measurement ID (e.g., `G-XXXX`). Leave empty to disable analytics |
| `CF_ACCESS_CLIENT_ID`     | No       | Cloudflare Access Service Token Client ID (only if Ghost is protected by Cloudflare Access) |
| `CF_ACCESS_CLIENT_SECRET` | No       | Cloudflare Access Service Token Client Secret                                               |

### Cloudflare Configuration (Optional)

If your Ghost instance is protected by Cloudflare, you may need additional configuration:"

### 3. Get Your Ghost Content API Key

1. Log in to your Ghost Admin panel
2. Navigate to **Settings** → **Integrations**
3. Click **Add custom integration**
4. Copy the **Content API Key** into your `.env` file

> **Tip**: Use the Ghost Demo API for testing:
>
> ```env
> GHOST_URL=https://demo.ghost.io
> GHOST_CONTENT_KEY=22444f78447824223cefc48062
> ```

### 4. Start Development Server

```bash
pnpm dev
```

Visit `http://localhost:4321` to see your site.

## Common Commands

| Command            | Description                                                 |
| ------------------ | ----------------------------------------------------------- |
| `pnpm dev`         | Start the development server                                |
| `pnpm build`       | Build the production site                                   |
| `pnpm preview`     | Preview the production build                                |
| `pnpm astro sync`  | Generate type definitions (useful after env/schema changes) |
| `pnpm astro check` | Typecheck and validate Astro project                        |
| `pnpm test`        | Run the test suite                                          |
| `pnpm format`      | Format the codebase                                         |

---

## 📝 Content Publishing Guide

### Classification Tags

Use **regular tags** to classify your posts. The system recognizes special prefixes:

| Tag Prefix    | Purpose           | Example                                                    |
| ------------- | ----------------- | ---------------------------------------------------------- |
| `type-`       | Post display type | `type-article`, `type-gallery`, `type-video`, `type-music` |
| `category-`   | Content category  | `category-tech`, `category-life`, `category-design`        |
| `series-`     | Article series    | `series-astro-tutorial`, `series-web-dev-basics`           |
| _(no prefix)_ | General tags      | `JavaScript`, `React`, `Photography`                       |

#### Supported Post Types

| Type Tag       | Display Style               |
| -------------- | --------------------------- |
| `type-article` | Standard article layout     |
| `type-gallery` | Image gallery with carousel |
| `type-video`   | Video player embed          |
| `type-music`   | Audio player embed          |
| _(default)_    | Default card layout         |

---

## 🌐 Multi-language Content

### URL Structure

| Route          | Description                                 |
| -------------- | ------------------------------------------- |
| `/`            | Auto-redirects to user's preferred language |
| `/zh/`         | Chinese posts listing                       |
| `/ja/`         | Japanese posts listing                      |
| `/en/`         | English posts listing                       |
| `/zh/p/{key}/` | Chinese version of article                  |
| `/ja/p/{key}/` | Japanese version of article                 |
| `/en/p/{key}/` | English version of article                  |

### Required Tags for Multi-language

Use **internal tags** (starting with `#`) in Ghost:

| Internal Tag     | Purpose                      | Example                            |
| ---------------- | ---------------------------- | ---------------------------------- |
| `#lang-{locale}` | Specify post language        | `#lang-zh`, `#lang-ja`, `#lang-en` |
| `#i18n-{key}`    | Translation group identifier | `#i18n-intro-to-solitude`          |

> **Note**: In Ghost Content API, internal tags `#xxx` are converted to slug format `hash-xxx`.

### Step-by-Step: Creating Multi-language Posts

**Important**: Each language version is a **separate post** in Ghost. They are linked together using the same `#i18n-{key}` tag.

#### Step 1: Plan your translation group key

Choose a unique key for your article, e.g., `astro-guide`. This key will be used in:

- The `#i18n-astro-guide` tag (to link all versions)
- The URL: `/zh/p/astro-guide`, `/ja/p/astro-guide`, `/en/p/astro-guide`

#### Step 2: Create the Chinese version

In Ghost Admin, create a new post:

1. Write your article content in Chinese
2. Open the **Post settings** panel (gear icon)
3. Scroll down to **Tags** section
4. Add these tags:
    - `#lang-zh` (language tag - note the `#` prefix!)
    - `#i18n-astro-guide` (translation group tag)
    - `type-article` (optional: post type)
    - `category-tech` (optional: category)
5. Publish the post

#### Step 3: Create the Japanese version

Create a **new, separate post** in Ghost:

1. Write your article content in Japanese
2. Add these tags:
    - `#lang-ja` ← Different language
    - `#i18n-astro-guide` ← **Same** translation key!
    - `type-article`, `category-tech` (same as Chinese version)
3. Publish the post

#### Step 4: Create the English version

Create another **new, separate post** in Ghost:

1. Write your article content in English
2. Add these tags:
    - `#lang-en` ← Different language
    - `#i18n-astro-guide` ← **Same** translation key!
    - `type-article`, `category-tech` (same as other versions)
3. Publish the post

#### Result

Now you have 3 separate posts in Ghost, all linked by `#i18n-astro-guide`:

- Chinese post → accessible at `/zh/p/astro-guide`
- Japanese post → accessible at `/ja/p/astro-guide`
- English post → accessible at `/en/p/astro-guide`

Users can switch between versions using the language switcher on the article page.

### Complete Example

| Post Title                             | Tags                                                             |
| -------------------------------------- | ---------------------------------------------------------------- |
| "Astro 入门指南" (Chinese)             | `#lang-zh`, `#i18n-astro-guide`, `type-article`, `category-tech` |
| "Astro入門ガイド" (Japanese)           | `#lang-ja`, `#i18n-astro-guide`, `type-article`, `category-tech` |
| "Getting Started with Astro" (English) | `#lang-en`, `#i18n-astro-guide`, `type-article`, `category-tech` |

### Fallback Behavior

- If a language version doesn't exist, the default language (Chinese) is shown
- A notice banner appears indicating the fallback
- Language switcher shows available/unavailable versions

---

## 🛠️ For Developers

See [**docs/DEVELOPMENT.md**](docs/DEVELOPMENT.md) for:

- 🔧 Tech Stack & Project Structure
- 🧞 Available Commands
- 📋 Testing Guide (Unit & Integration)
- 🏗️ Architecture & Code Reference

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
