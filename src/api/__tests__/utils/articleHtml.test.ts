import { describe, expect, it } from 'vitest';
import {
    enhanceArticleCodeBlocks,
    normalizeArticleHeadingHierarchy,
    prepareArticleHtml,
    wrapArticleTables,
} from '@api/utils/articleHtml';

describe('articleHtml utilities', () => {
    it('demotes body h1 headings to h2 while preserving attributes', () => {
        const html = '<h1 id="intro">Intro</h1><h2>Details</h2>';

        expect(normalizeArticleHeadingHierarchy(html)).toBe(
            '<h2 id="intro">Intro</h2><h2>Details</h2>'
        );
    });

    it('renders localized SSR code block controls', () => {
        const html = '<pre><code class="language-ts">const x = 1;</code></pre>';

        const result = enhanceArticleCodeBlocks(html, {
            wrap: '换行',
            scroll: '滚动',
            copy: '复制',
            copied: '已复制',
            failed: '失败',
            expand: '展开',
            collapse: '收起',
        });

        expect(result).toContain('class="code-block-shell');
        expect(result).toContain('<span class="code-block-language">TS</span>');
        expect(result).toContain('data-code-wrap');
        expect(result).toContain('>换行</button>');
        expect(result).toContain('data-code-copy');
        expect(result).toContain('>复制</button>');
    });

    it('collapses long code and wraps config-like code by default', () => {
        const lines = Array.from({ length: 10 }, (_, index) => `key${index}: value`).join('\n');
        const html = `<pre><code class="language-yaml">${lines}</code></pre>`;

        const result = enhanceArticleCodeBlocks(html);

        expect(result).toContain('is-wrapped');
        expect(result).toContain('is-collapsed');
        expect(result).toContain('data-code-toggle-lines');
        expect(result).toContain('data-code-lines="10"');
    });

    it('wraps tables in a horizontal scroll container', () => {
        const html = '<table><tbody><tr><td>Cell</td></tr></tbody></table>';

        expect(wrapArticleTables(html)).toBe(
            '<div class="article-table-scroll" role="region" aria-label="Scrollable table" tabindex="0"><table><tbody><tr><td>Cell</td></tr></tbody></table></div>'
        );
    });

    it('prepares article html in one pass', () => {
        const html =
            '<h1>Title</h1><pre data-language="bash"><code>echo hi</code></pre><table><tbody><tr><td>Cell</td></tr></tbody></table>';

        const result = prepareArticleHtml(html);

        expect(result).toContain('<h2>Title</h2>');
        expect(result).toContain('class="code-block-shell');
        expect(result).toContain('<span class="code-block-language">BASH</span>');
        expect(result).toContain('class="article-table-scroll"');
    });
});
