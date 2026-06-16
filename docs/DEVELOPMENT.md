# Development Guide

This document covers development setup, architecture, and testing for the Solitude Interface project. It also doubles as the engineering reference for the showcase: if you're here to read how the data layer, i18n system, and tests are put together rather than to run your own instance, this is the place.

[Back to README](../README.md)

## Table of Contents

- [Tech Stack](#tech-stack)
- [Package Manager](#package-manager-pnpm)
- [Project Structure](#project-structure)
- [Commands](#commands)
- [Testing](#testing)
- [Architecture](#architecture)
- [Additional Resources](#additional-resources)

---

## Tech Stack

- [Astro](https://astro.build/) - Static site generator
- [React](https://reactjs.org/) - UI components
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [Ghost Content API](https://ghost.org/docs/content-api/) - Headless CMS
- [Vitest](https://vitest.dev/) - Testing framework
- **pnpm** - Package manager

---

## Package Manager (pnpm)

This project uses **pnpm**.

### Install pnpm (recommended via Corepack)

```bash
corepack enable pnpm
pnpm -v
```

> If `corepack` is not available, install pnpm globally:
>
> ```bash
> npm i -g pnpm
> ```

### Install dependencies

```bash
pnpm install
```

> If you ever see a warning like "Ignored build scripts ...", run:
>
> ```bash
> pnpm approve-builds
> ```
>
> and allow trusted dependencies (e.g. `esbuild`, `sharp`).

---

## Project Structure

```
src/
├── api/                    # Ghost API integration
│   ├── adapters/           # Data transformers
│   ├── clients/            # API clients
│   ├── config/             # Environment configuration
│   ├── ghost/              # Ghost-specific APIs
│   ├── utils/              # Utilities (cache, error handlers)
│   └── __tests__/          # API tests
├── assets/                 # Static assets (avatar, etc.)
├── components/             # UI components
│   ├── common/             # Shared components
│   ├── home/               # Homepage components
│   ├── i18n/               # Internationalization components
│   ├── layout/             # Layout components (navbar, dock)
│   ├── pages/              # Page-specific components
│   ├── posts/              # Post display components
│   └── utils/              # Component-level utilities (analytics)
├── layouts/                # Astro layouts
├── lib/                    # Core libraries (i18n, tag registry)
├── pages/                  # Astro pages
├── stores/                 # State management (Jotai)
├── styles/                 # Global styles
└── types/                  # TypeScript types
```

---

## Commands

| Command                 | Action                                      |
| :---------------------- | :------------------------------------------ |
| `pnpm install`          | Install dependencies                        |
| `pnpm dev`              | Start local dev server at `localhost:4321`  |
| `pnpm build`            | Build production site to `./dist/`          |
| `pnpm preview`          | Preview build locally before deploying      |
| `pnpm astro sync`       | Generate Astro type definitions             |
| `pnpm astro check`      | Typecheck and validate Astro project        |
| `pnpm format`           | Format code with Prettier (writes changes)  |
| `pnpm format:check`     | Check formatting with Prettier (no changes) |
| `pnpm test`             | Run unit tests in watch mode                |
| `pnpm test:run`         | Run the unit suite once (CI-friendly)       |
| `pnpm test:unit`        | Run unit tests once (alias of `test:run`)   |
| `pnpm test:integration` | Run integration tests (real API calls)      |
| `pnpm test:coverage`    | Run unit tests with coverage report         |
| `pnpm test:ui`          | Open Vitest UI for interactive testing      |

---

## Testing

This project includes two types of tests:

- **Unit Tests**: Fast tests using mock data, no external dependencies
- **Integration Tests**: Tests using real Ghost API to verify actual behavior

### Quick Start

```bash
# Watch mode - runs tests on file changes
pnpm test

# Run only unit tests (fast, no API needed)
pnpm test:unit

# Run only integration tests (requires .env configuration)
pnpm test:integration

# Run the unit suite once (CI-friendly)
pnpm test:run
```

### Unit Tests vs Integration Tests

| Feature          | Unit Tests        | Integration Tests            |
| ---------------- | ----------------- | ---------------------------- |
| **Speed**        | Fast (< 1s)       | Slower (10-30s)              |
| **Dependencies** | None              | Requires .env + network      |
| **API Calls**    | Mocked            | Real Ghost API               |
| **Use Case**     | Daily development | Scheduled / on-demand checks |
| **Command**      | `pnpm test:unit`  | `pnpm test:integration`      |

### Available Test Commands

```bash
# Watch mode - runs tests on file changes
pnpm test

# Run the unit suite once (CI-friendly)
pnpm test:run

# Run unit tests only (alias of test:run)
pnpm test:unit

# Run integration tests only
pnpm test:integration

# Generate coverage report
pnpm test:coverage

# Open interactive UI
pnpm test:ui
```

### What's Tested

#### Unit Tests (with mocks)

- Ghost adapter logic (URL transformations, tag extraction)
- Cloudflare Zero Trust adapter
- Cache utilities
- Error handlers
- API client structure

#### Integration Tests (with real API)

- Real Ghost API connection
- Fetching posts and site information
- Data structure validation
- URL adaptation and transformation
- Tag extraction and categorization
- Cache performance (first call = API, second call = cache)
- Error handling with actual endpoints

### Test Structure

```
src/api/__tests__/
├── setup.ts                          # Unit test setup (mocks env vars)
├── setup.integration.ts              # Integration test setup (uses real env vars)
├── adapters/
│   ├── ghost.test.ts                 # Unit: Ghost adapter
│   └── cloudflare.test.ts            # Unit: Cloudflare adapter
├── clients/
│   ├── ghost.test.ts                 # Unit: Ghost API client
│   └── ghost.integration.test.ts     # Integration: Real API calls
├── ghost/
│   ├── posts.test.ts                 # Unit: Posts API
│   ├── posts.integration.test.ts     # Integration: Real post data
│   ├── settings.test.ts              # Unit: Settings API
│   └── settings.integration.test.ts  # Integration: Real site info
└── utils/
    ├── cache.test.ts                 # Unit: Cache utilities
    └── errorHandlers.test.ts         # Unit: Error handlers
```

**Naming Convention:**

- Unit tests: `*.test.ts`
- Integration tests: `*.integration.test.ts`

---

## Architecture

### Tag Processing System

The following code in `src/api/adapters/ghost.ts` handles tag extraction:

```ts
const TAG_PREFIXES = {
    TYPE: 'type-',
    CATEGORY: 'category-',
    SERIES: 'series-',
    HASH: 'hash-',
} as const;
```

### i18n System

The i18n system (defined in `src/lib/i18nCore.ts`, re-exported via the `src/lib/i18n.ts` barrel) handles language tags:

```ts
const LANG_TAG_PREFIX = 'hash-lang-'; // Ghost converts #lang-xx to hash-lang-xx
const I18N_TAG_PREFIX = 'hash-i18n-'; // Ghost converts #i18n-xx to hash-i18n-xx
```

### Multi-language Configuration

Default language is set in `src/lib/i18nCore.ts`:

```ts
export const DEFAULT_LOCALE: Locale = 'zh';
```

To change the default, modify this value and update `astro.config.mjs`. The `locales` order is load-bearing — it drives the fallback precedence (Japanese before English when Chinese is missing), so keep it in sync with the runtime `LOCALES` array in `src/lib/i18nCore.ts`:

```js
i18n: {
    locales: ['zh', 'ja', 'en'],
    defaultLocale: 'zh',  // Change this
}
```

---

## Additional Resources

- [Ghost Content API Documentation](https://ghost.org/docs/content-api/)
- [Ghost API Endpoints](https://ghost.org/docs/content-api/#endpoints)
- [Ghost API Authentication](https://ghost.org/docs/content-api/#authentication)
- [Vitest Documentation](https://vitest.dev/)
- [Astro Documentation](https://docs.astro.build/)
