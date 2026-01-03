# Solitude Interface

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

> Replace the placeholder images in `docs/assets/` with your own screenshots.

| Page | Preview |
|------|---------|
| Home | ![Home](docs/assets/screenshot-home.png) |
| Post | ![Post](docs/assets/screenshot-post.png) |
| Gallery | ![Gallery](docs/assets/screenshot-gallery.png) |
| Mobile | ![Mobile](docs/assets/screenshot-mobile.png) |

## 📖 Documentation

| Document | Description |
|----------|-------------|
| **README.md** (this file) | User guide - setup and content publishing |
| [**docs/DEVELOPMENT.md**](docs/DEVELOPMENT.md) | Developer guide - architecture, testing, commands |
| [**docs/ai/ai-context.md**](docs/ai/ai-context.md) | Stable AI context (prompt cache prefix) |
| [**docs/guides/dev-workflow.md**](docs/guides/dev-workflow.md) | Token-saving dev workflow and commands |
| [**docs/ai/plan.md**](docs/ai/plan.md) | Change checkpoints and update triggers |

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

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
SITE_URL=https://your-site.example.com
```

#### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GHOST_URL` | Yes | Base URL of your Ghost instance |
| `GHOST_CONTENT_KEY` | Yes | Ghost Content API key |
| `GHOST_VERSION` | Yes | Ghost Content API version (e.g., `v5.0`) |
| `SITE_URL` | Yes | Public site URL for canonical and hreflang |

### 3. Get Your Ghost Content API Key

1. Log in to your Ghost Admin panel
2. Navigate to **Settings** → **Integrations**
3. Click **Add custom integration**
4. Copy the **Content API Key** into your `.env` file

> **Tip**: Use the Ghost Demo API for testing:
> ```env
> GHOST_URL=https://demo.ghost.io
> GHOST_CONTENT_KEY=22444f78447824223cefc48062
> ```

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:4321` to see your site.

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Build the production site |
| `npm run preview` | Preview the production build |
| `npm run test` | Run the test suite |
| `npm run format` | Format the codebase |

---

## 📝 Content Publishing Guide

### Classification Tags

Use **regular tags** to classify your posts. The system recognizes special prefixes:

| Tag Prefix | Purpose | Example |
|------------|---------|---------|
| `type-` | Post display type | `type-article`, `type-gallery`, `type-video`, `type-music` |
| `category-` | Content category | `category-tech`, `category-life`, `category-design` |
| `series-` | Article series | `series-astro-tutorial`, `series-web-dev-basics` |
| *(no prefix)* | General tags | `JavaScript`, `React`, `Photography` |

#### Supported Post Types

| Type Tag | Display Style |
|----------|---------------|
| `type-article` | Standard article layout |
| `type-gallery` | Image gallery with carousel |
| `type-video` | Video player embed |
| `type-music` | Audio player embed |
| *(default)* | Default card layout |

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

| Internal Tag | Purpose | Example |
|--------------|---------|---------|
| `#lang-{locale}` | Specify post language | `#lang-zh`, `#lang-ja`, `#lang-en` |
| `#i18n-{key}` | Translation group identifier | `#i18n-intro-to-solitude` |

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

| Post Title | Tags |
|------------|------|
| "Astro 入门指南" (Chinese) | `#lang-zh`, `#i18n-astro-guide`, `type-article`, `category-tech` |
| "Astro入門ガイド" (Japanese) | `#lang-ja`, `#i18n-astro-guide`, `type-article`, `category-tech` |
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
