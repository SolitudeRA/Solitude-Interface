# Solitude Interface

![thumbnail](docs/assets/thumbnail.png)

![Node.js](https://img.shields.io/badge/Node.js-≥18-339933?logo=node.js&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-≥9-F69220?logo=pnpm&logoColor=white)
![Astro](https://img.shields.io/badge/Astro-5.x-BC52EE?logo=astro&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

A modern personal blog interface built with Astro and powered by the Ghost CMS Content API.

**[Live Demo](https://www.solitudera.com)** · [Documentation](docs/DEVELOPMENT.md)

> **About this repo** — this is the source of my personal site ([solitudera.com](https://www.solitudera.com)), open-sourced as a showcase and for reference. It is **not maintained as a reusable template**, and I'm not actively taking issues or pull requests. It's MIT-licensed, so you're welcome to look around or fork it.

Read this in: English | [简体中文](docs/i18n/README.zh.md) | [日本語](docs/i18n/README.ja.md)

---

## Table of Contents

- [Highlights](#highlights)
- [Screenshots](#screenshots)
- [Tech Stack & Architecture](#tech-stack--architecture)
- [Run It Locally](#run-it-locally)
- [Self-Hosting & Content Guide](#self-hosting--content-guide)
- [License](#license)

---

## Highlights

- **Astro 5 static site + React islands** — content is pre-rendered at build time; interactivity is hydrated only where it's needed (`client:idle` / `client:visible` / `client:load`).
- **Typed Ghost CMS data layer** — a headless Ghost Content API client (with retry + timeout) → a typed adapter → cached, grouped posts, with runtime validation at the external-data boundary.
- **Multi-language (zh / ja / en)** — posts are grouped across languages by tag/slug with a three-tier fallback; `hreflang`, `canonical`, and per-page `html lang` for SEO.
- **Hand-tuned motion** — a spring-driven post timeline and an ambient bottom progress bar (critically-damped rAF spring with velocity-aware glow), all `prefers-reduced-motion` aware.
- **OKLch dual-theme design system** — light/dark tokens defined in a perceptually-uniform color space, wired into Tailwind v4 via CSS-first `@theme`.
- **Engineered for confidence** — strict TypeScript (`exactOptionalPropertyTypes`), unit + integration tests (Vitest), and a multi-step CI (lint / test / typecheck / build).

For the architecture, code reference, and testing guide, see **[DEVELOPMENT.md](docs/DEVELOPMENT.md)**.

---

## Screenshots

<details>
<summary>Click to expand screenshots</summary>

### Home

![Home](docs/assets/home.png)

### Post

![Post](docs/assets/post.png)

### About Me

![About-Me](docs/assets/about-me.png)

### Post Detail

![Post-Detail](docs/assets/post-detail.png)

</details>

---

## Tech Stack & Architecture

Astro 5 (SSG) · React 19 islands · Jotai · Tailwind v4 · Ghost CMS (headless) · shiki · motion · TypeScript (strict).

Data flows in one direction: **Ghost → typed client → adapter → cached posts → pages (SSG) → presentational components**. The full picture — project structure, the tag / i18n systems, and the testing strategy — lives in **[DEVELOPMENT.md](docs/DEVELOPMENT.md)**.

---

## Run It Locally

Just want to explore the code? The fastest path uses the public Ghost Demo API — no account needed:

```bash
corepack enable pnpm   # or: npm i -g pnpm
pnpm install
cp .env.example .env
pnpm dev               # http://localhost:4321
```

Then point `.env` at the Ghost demo:

```env
GHOST_URL=https://demo.ghost.io
GHOST_CONTENT_KEY=22444f78447824223cefc48062
SITE_URL=http://localhost:4321
```

> Useful checks: `pnpm check` (lint + format + typecheck) and `pnpm test:run` (unit tests). See [DEVELOPMENT.md](docs/DEVELOPMENT.md) for the full command list.

---

## Self-Hosting & Content Guide

The repo doubles as the real implementation of my site, so the full operator setup is here if you want to run it against your own Ghost instance or see how content is modeled.

<details>
<summary><strong>Setup, environment, content publishing, multi-language &amp; deployment</strong></summary>

### Configure environment

Edit `.env` with your own Ghost instance:

```env
GHOST_URL=https://your-ghost-instance.com
GHOST_CONTENT_KEY=your-content-api-key-here
GHOST_VERSION=v5.0
GHOST_TIMEOUT=5000
SITE_URL=https://your-site.example.com
IMAGE_HOST_URL=
GOOGLE_ANALYTICS_TAG_ID=
```

#### Required

| Variable            | Description                                |
| ------------------- | ------------------------------------------ |
| `GHOST_URL`         | Base URL of your Ghost instance            |
| `GHOST_CONTENT_KEY` | Ghost Content API key                      |
| `SITE_URL`          | Public site URL for canonical and hreflang |

#### Optional

| Variable                  | Default | Description                                                                               |
| ------------------------- | ------- | ----------------------------------------------------------------------------------------- |
| `GHOST_VERSION`           | `v5.0`  | Ghost Content API version                                                                 |
| `GHOST_TIMEOUT`           | `5000`  | Ghost request timeout in milliseconds                                                     |
| `IMAGE_HOST_URL`          | -       | Image host/CDN for the remote image domain allowlist (single URL or comma-separated list) |
| `GOOGLE_ANALYTICS_TAG_ID` | -       | Google tag / GA4 Measurement ID (e.g., `G-XXXX`). Leave empty to disable                  |
| `CF_ACCESS_CLIENT_ID`     | -       | Cloudflare Access Service Token Client ID (if Ghost is protected by CF Access)            |
| `CF_ACCESS_CLIENT_SECRET` | -       | Cloudflare Access Service Token Client Secret                                             |

#### Get your Ghost Content API key

1. Log in to your Ghost Admin panel
2. Navigate to **Settings** → **Integrations**
3. Click **Add custom integration**
4. Copy the **Content API Key** into your `.env`

### Cloudflare Access (optional)

If your Ghost instance is protected by [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/), configure a **Service Token** so the API can be reached:

1. **Create a Service Token** in Cloudflare Zero Trust: **Access** → **Service Auth** → **Service Tokens** → **Create Service Token**; copy the **Client ID** and **Client Secret**.
2. **Add them to `.env`** as `CF_ACCESS_CLIENT_ID` / `CF_ACCESS_CLIENT_SECRET`.
3. **Add a Service Auth policy** to your Ghost Access Application selecting that token.

> **Note**: this project only implements **Service Token** authentication — it sends `CF-Access-Client-Id` / `CF-Access-Client-Secret` headers when **both** variables are set (setting only one sends neither and logs a warning).

The following are **Cloudflare dashboard policies — not implemented or read by this project**; they merely let the Content API through if you have added extra protection:

- **Bot Fight Mode**: Cloudflare → Security → WAF → Custom rules → URI Path starts with `/ghost/api/content/`, Action = Skip → all Super Bot Fight Mode rules.
- **Zero Trust Access Bypass**: Zero Trust → Access → Applications → add `your-ghost-domain.com/ghost/api/content/*` with a **Bypass** policy.

### Content publishing

Use **regular tags** to classify posts. Special prefixes are recognized:

| Tag Prefix    | Purpose           | Example                                                    |
| ------------- | ----------------- | ---------------------------------------------------------- |
| `type-`       | Post display type | `type-article`, `type-gallery`, `type-video`, `type-music` |
| `category-`   | Content category  | `category-tech`, `category-life`, `category-design`        |
| `series-`     | Article series    | `series-astro-tutorial`, `series-web-dev-basics`           |
| _(no prefix)_ | General tags      | `JavaScript`, `React`, `Photography`                       |

| Type Tag       | Display Style               |
| -------------- | --------------------------- |
| `type-article` | Standard article layout     |
| `type-gallery` | Image gallery with carousel |
| `type-video`   | Video player embed          |
| `type-music`   | Audio player embed          |
| _(default)_    | Default card layout         |

### Multi-language content

| Route          | Description                                 |
| -------------- | ------------------------------------------- |
| `/`            | Auto-redirects to user's preferred language |
| `/zh/`         | Chinese posts listing                       |
| `/ja/`         | Japanese posts listing                      |
| `/en/`         | English posts listing                       |
| `/zh/p/{key}/` | Chinese version of an article               |
| `/ja/p/{key}/` | Japanese version of an article              |
| `/en/p/{key}/` | English version of an article               |

Use **internal tags** (starting with `#`) in Ghost:

| Internal Tag     | Purpose                      | Example                            |
| ---------------- | ---------------------------- | ---------------------------------- |
| `#lang-{locale}` | Specify post language        | `#lang-zh`, `#lang-ja`, `#lang-en` |
| `#i18n-{key}`    | Translation group identifier | `#i18n-intro-to-solitude`          |

> In the Ghost Content API, internal tags `#xxx` become slugs `hash-xxx`.

**Slug naming convention (reserved prefixes)** — besides internal tags, the system can also derive a post's identity from the Ghost **slug**, using `{locale}-{key}`:

| Post slug         | Resolves to                                            |
| ----------------- | ------------------------------------------------------ |
| `ja-homeserver-8` | locale `ja`, key `homeserver-8` → `/ja/p/homeserver-8` |
| `en-blog-project` | locale `en`, key `blog-project` → `/en/p/blog-project` |

> **Important: `zh-` / `ja-` / `en-` are reserved slug prefixes.** Any slug starting with a valid locale code plus a hyphen is treated as a multi-language post of that locale, **even without `#lang-*` / `#i18n-*` tags** — so don't give an ordinary (non-multilingual) post a `zh-…` / `ja-…` / `en-…` slug, or it will be merged into a translation group with wrong `/{locale}/p/{key}` routes and hreflang. When a post also carries a `#lang-*` tag: **language** comes from the tag first (slug prefix as fallback); the **translation-group key** comes from the slug first (`#i18n-*` tag as fallback).

**Creating a multi-language post** — each language version is a **separate post** in Ghost, linked by a shared `#i18n-{key}` tag:

1. Pick a translation-group key (e.g. `astro-guide`) — it's used in the `#i18n-astro-guide` tag and the URL `/{locale}/p/astro-guide`.
2. Create the Chinese post: write the content, add tags `#lang-zh` and `#i18n-astro-guide` (plus optional `type-article`, `category-tech`), publish.
3. Create the Japanese post (a separate post): tags `#lang-ja` and the **same** `#i18n-astro-guide`, publish.
4. Create the English post (a separate post): tags `#lang-en` and the **same** `#i18n-astro-guide`, publish.

The three become `/zh/p/astro-guide`, `/ja/p/astro-guide`, `/en/p/astro-guide`, switchable from the language switcher.

| Post title                   | Tags                                                             |
| ---------------------------- | ---------------------------------------------------------------- |
| "Astro 入门指南" (Chinese)   | `#lang-zh`, `#i18n-astro-guide`, `type-article`, `category-tech` |
| "Astro入門ガイド" (Japanese) | `#lang-ja`, `#i18n-astro-guide`, `type-article`, `category-tech` |
| "Getting Started…" (English) | `#lang-en`, `#i18n-astro-guide`, `type-article`, `category-tech` |

**Fallback**: if a requested language is missing, the default language (Chinese) is shown; if that's also missing, any available variant is shown in `LOCALES` order (`zh`, `ja`, `en`) — this order is load-bearing (Japanese is preferred over English when Chinese is absent). A banner indicates the fallback.

### Deploying

This is a static site (Astro SSG) — `pnpm build` outputs to `dist/`, hostable on any static host (e.g. Cloudflare Pages). Set the same environment variables on your build platform as in your local `.env`: static generation happens **at build time**, so Ghost content is fetched and pre-rendered during the build and your credentials never ship to `dist/`.

</details>

---

## License

MIT — see [LICENSE](LICENSE). Feel free to fork and adapt.
