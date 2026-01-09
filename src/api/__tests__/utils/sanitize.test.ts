import { describe, it, expect } from 'vitest';
import { sanitizeHtml, containsSuspiciousContent } from '@api/utils/sanitize';

describe('HTML Sanitization', () => {
    describe('sanitizeHtml', () => {
        it('should return empty string for null/undefined input', () => {
            expect(sanitizeHtml('')).toBe('');
            expect(sanitizeHtml(null as unknown as string)).toBe('');
            expect(sanitizeHtml(undefined as unknown as string)).toBe('');
        });

        it('should preserve safe HTML tags', () => {
            const input = '<p>Hello <strong>World</strong></p>';
            expect(sanitizeHtml(input)).toBe(input);
        });

        it('should preserve headings', () => {
            const input = '<h1>Title</h1><h2>Subtitle</h2>';
            expect(sanitizeHtml(input)).toBe(input);
        });

        it('should preserve links with safe attributes', () => {
            const input = '<a href="https://example.com">Link</a>';
            expect(sanitizeHtml(input)).toBe(input);
        });

        it('should preserve images', () => {
            const input =
                '<img src="https://example.com/image.jpg" alt="Image" />';
            const result = sanitizeHtml(input);
            expect(result).toContain('<img');
            expect(result).toContain('src="https://example.com/image.jpg"');
            expect(result).toContain('alt="Image"');
        });

        it('should preserve code blocks', () => {
            const input =
                '<pre><code class="language-js">const x = 1;</code></pre>';
            expect(sanitizeHtml(input)).toBe(input);
        });

        it('should preserve tables', () => {
            const input =
                '<table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Cell</td></tr></tbody></table>';
            expect(sanitizeHtml(input)).toBe(input);
        });

        it('should preserve lists', () => {
            const input = '<ul><li>Item 1</li><li>Item 2</li></ul>';
            expect(sanitizeHtml(input)).toBe(input);
        });

        it('should remove script tags', () => {
            const input = '<p>Hello</p><script>alert("xss")</script>';
            const result = sanitizeHtml(input);
            expect(result).toBe('<p>Hello</p>');
            expect(result).not.toContain('script');
        });

        it('should remove style tags', () => {
            const input = '<style>body { color: red; }</style><p>Hello</p>';
            const result = sanitizeHtml(input);
            expect(result).not.toContain('style');
            expect(result).toContain('<p>Hello</p>');
        });

        it('should remove event handlers', () => {
            const input = '<img src="x" onerror="alert(1)" />';
            const result = sanitizeHtml(input);
            expect(result).not.toContain('onerror');
        });

        it('should remove onclick handlers', () => {
            const input = '<button onclick="alert(1)">Click</button>';
            const result = sanitizeHtml(input);
            expect(result).not.toContain('onclick');
        });

        it('should remove javascript: URLs', () => {
            const input = '<a href="javascript:alert(1)">Click</a>';
            const result = sanitizeHtml(input);
            expect(result).not.toContain('javascript:');
        });

        it('should preserve data attributes for code highlighting', () => {
            const input =
                '<pre data-language="javascript" data-line="1-5"><code>code</code></pre>';
            expect(sanitizeHtml(input)).toBe(input);
        });

        it('should add rel="noopener noreferrer" to target="_blank" links', () => {
            const input =
                '<a href="https://example.com" target="_blank">Link</a>';
            const result = sanitizeHtml(input);
            expect(result).toContain('rel="noopener noreferrer"');
        });

        it('should preserve existing rel attribute and add security values', () => {
            const input =
                '<a href="https://example.com" target="_blank" rel="external">Link</a>';
            const result = sanitizeHtml(input);
            expect(result).toContain('noopener');
            expect(result).toContain('noreferrer');
        });

        it('should preserve iframes (for video embeds)', () => {
            const input =
                '<iframe src="https://www.youtube.com/embed/abc123" frameborder="0" allowfullscreen></iframe>';
            const result = sanitizeHtml(input);
            expect(result).toContain('<iframe');
            expect(result).toContain(
                'src="https://www.youtube.com/embed/abc123"',
            );
        });

        it('should remove form elements', () => {
            const input =
                '<form action="/submit"><input type="text" /><button>Submit</button></form>';
            const result = sanitizeHtml(input);
            expect(result).not.toContain('<form');
            expect(result).not.toContain('<input');
        });

        it('should remove object and embed tags', () => {
            const input =
                '<object data="evil.swf"></object><embed src="evil.swf" />';
            const result = sanitizeHtml(input);
            expect(result).not.toContain('<object');
            expect(result).not.toContain('<embed');
        });
    });

    describe('containsSuspiciousContent', () => {
        it('should return false for safe content', () => {
            expect(containsSuspiciousContent('<p>Hello World</p>')).toBe(false);
            expect(
                containsSuspiciousContent(
                    '<a href="https://example.com">Link</a>',
                ),
            ).toBe(false);
        });

        it('should return false for empty/null input', () => {
            expect(containsSuspiciousContent('')).toBe(false);
            expect(containsSuspiciousContent(null as unknown as string)).toBe(
                false,
            );
        });

        it('should detect script tags', () => {
            expect(containsSuspiciousContent('<script>alert(1)</script>')).toBe(
                true,
            );
            expect(containsSuspiciousContent('<SCRIPT>alert(1)</SCRIPT>')).toBe(
                true,
            );
        });

        it('should detect javascript: URLs', () => {
            expect(
                containsSuspiciousContent('<a href="javascript:alert(1)">'),
            ).toBe(true);
        });

        it('should detect event handlers', () => {
            expect(containsSuspiciousContent('<img onerror="alert(1)">')).toBe(
                true,
            );
            expect(containsSuspiciousContent('<div onclick="alert(1)">')).toBe(
                true,
            );
            expect(containsSuspiciousContent('<body onload="alert(1)">')).toBe(
                true,
            );
        });

        it('should detect data:text/html URLs', () => {
            expect(
                containsSuspiciousContent(
                    '<iframe src="data:text/html,<script>alert(1)</script>">',
                ),
            ).toBe(true);
        });
    });
});
