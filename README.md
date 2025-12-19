# Solitude Interface

A modern personal blog interface built with Astro and powered by Ghost CMS API. This project is currently under active development.

## 🚀 Project Features

- High-performance static site built with Astro
- Ghost CMS integration (Headless)
- **Multi-language support (zh/ja/en)** with automatic fallback
- Responsive design
- Dark/light theme toggle
- Multiple post type displays (articles, gallery, video, music)
- SEO optimized (hreflang, canonical, html lang)
- Comprehensive testing suite (unit + integration tests)

## 🚧 Development Status

This project is currently in active development. Features and documentation will be expanded as the project matures.

## 📂 Project Structure

The project follows a modular structure with separate directories for API integration, components, layouts, and pages.

## 🔧 Tech Stack

- [Astro](https://astro.build/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [Ghost Content API](https://ghost.org/docs/content-api/)
- [Vitest](https://vitest.dev/) - Testing framework

## 🧞 Commands

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Install dependencies                            |
| `npm run dev`             | Start local dev server at `localhost:4321`      |
| `npm run build`           | Build production site to `./dist/`              |
| `npm run preview`         | Preview build locally before deploying          |
| `npm run format`          | Format code with Prettier                       |
| `npm test`                | Run tests in watch mode                         |
| `npm run test:unit`       | Run unit tests only (fast, with mocks)          |
| `npm run test:integration`| Run integration tests (real API calls)          |
| `npm run test:coverage`   | Run tests with coverage report                  |
| `npm run test:ui`         | Open Vitest UI for interactive testing          |

## ⚙️ Environment Setup

### 1. Create Environment File

Create a `.env` file in the root directory. You can use `.env.example` as a template:

```bash
cp .env.example .env
```

### 2. Configure Environment Variables

Edit the `.env` file with your Ghost instance information:

```env
# Ghost Content API Configuration
GHOST_URL=https://your-ghost-instance.com
GHOST_CONTENT_KEY=your-content-api-key-here
GHOST_VERSION=v5.0

# Your Site URL
SITE_URL=https://your-site.example.com
```

### 3. Get Your Ghost Content API Key

1. Log in to your Ghost Admin panel
2. Navigate to **Settings** → **Integrations**
3. Click **Add custom integration**
4. Create an integration and copy the **Content API Key**
5. Paste the API key into your `.env` file

**Alternative**: Use the Ghost Demo API for testing:

```env
GHOST_URL=https://demo.ghost.io
GHOST_CONTENT_KEY=22444f78447824223cefc48062
```

> **Note**: The demo API is read-only and may have rate limits.

## 📋 Testing

This project includes two types of tests:

- **Unit Tests**: Fast tests using mock data, no external dependencies
- **Integration Tests**: Tests using real Ghost API to verify actual behavior

### Quick Start

```bash
# Run all tests
npm test

# Run only unit tests (fast, no API needed)
npm run test:unit

# Run only integration tests (requires .env configuration)
npm run test:integration
```

## 🧪 Running Tests

### Unit Tests vs Integration Tests

| Feature | Unit Tests | Integration Tests |
|---------|-----------|------------------|
| **Speed** | ⚡ Fast (< 1s) | 🐌 Slower (10-30s) |
| **Dependencies** | ✅ None | ⚠️ Requires .env + Network |
| **API Calls** | ❌ Mocked | ✅ Real Ghost API |
| **Use Case** | Daily development | Pre-commit verification |
| **Command** | `npm run test:unit` | `npm run test:integration` |

### Available Test Commands

```bash
# Watch mode - runs tests on file changes
npm test

# Run all tests once
npm run test:all

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Generate coverage report
npm run test:coverage

# Open interactive UI
npm run test:ui
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

## 🗂️ Test Structure

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

## 🌐 Multi-language (i18n) Support

This project supports three languages: **Chinese (zh)**, **Japanese (ja)**, and **English (en)**.

### URL Structure

| Route | Description |
|-------|-------------|
| `/` | Auto-redirects to user's preferred language |
| `/zh/` | Chinese posts listing |
| `/ja/` | Japanese posts listing |
| `/en/` | English posts listing |
| `/zh/p/{key}/` | Chinese version of article |
| `/ja/p/{key}/` | Japanese version of article |
| `/en/p/{key}/` | English version of article |

### Ghost Content Tagging (Required)

For multi-language to work, posts in Ghost must have specific internal tags:

1. **Language Tag** (required, one of):
   - `#lang-zh` - Chinese content
   - `#lang-ja` - Japanese content
   - `#lang-en` - English content

2. **Translation Group Tag** (required):
   - `#i18n-{key}` - Links translations together
   - Example: `#i18n-intro-to-solitude`

### Example: Creating Multi-language Posts

To create the same article in 3 languages:

| Post Title | Tags |
|------------|------|
| "Solitude 简介" (Chinese) | `#lang-zh`, `#i18n-intro-to-solitude` |
| "Solitude 紹介" (Japanese) | `#lang-ja`, `#i18n-intro-to-solitude` |
| "Intro to Solitude" (English) | `#lang-en`, `#i18n-intro-to-solitude` |

### Fallback Behavior

- If a language version doesn't exist, the default language (Chinese) is shown
- A notice banner appears indicating the fallback
- Language switcher shows available/unavailable versions

### Configuration

Default language is set in `src/lib/i18n.ts`:

```typescript
export const DEFAULT_LOCALE: Locale = 'zh';
```

To change the default, modify this value and update `astro.config.mjs`:

```javascript
i18n: {
    locales: ['zh', 'en', 'ja'],
    defaultLocale: 'zh',  // Change this
}
```

## 📚 Additional Resources

- [Ghost Content API Documentation](https://ghost.org/docs/content-api/)
- [Ghost API Endpoints](https://ghost.org/docs/content-api/#endpoints)
- [Ghost API Authentication](https://ghost.org/docs/content-api/#authentication)
- [Vitest Documentation](https://vitest.dev/)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
