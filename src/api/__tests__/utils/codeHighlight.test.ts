import { describe, test, expect } from 'vitest';
import { highlightCodeBlocks } from '@api/utils/codeHighlight';

describe('highlightCodeBlocks — 语言标识解析', () => {
    test('保留 "c++" 语言标识（不被截断为 "c"）', async () => {
        const html = '<pre><code class="language-c++">int main() { return 0; }</code></pre>';
        const result = await highlightCodeBlocks(html);
        expect(result).toContain('data-language="c++"');
    });

    test('保留 "c#" 语言标识（不被截断为 "c"）', async () => {
        const html = '<pre><code class="language-c#">class A {}</code></pre>';
        const result = await highlightCodeBlocks(html);
        expect(result).toContain('data-language="c#"');
    });

    test('保留 "f#" 语言标识（不被截断为 "f"）', async () => {
        const html = '<pre><code class="language-f#">let x = 1</code></pre>';
        const result = await highlightCodeBlocks(html);
        expect(result).toContain('data-language="f#"');
    });

    test('普通单词语言仍正常高亮（typescript）', async () => {
        const html = '<pre><code class="language-typescript">const x = 1;</code></pre>';
        const result = await highlightCodeBlocks(html);
        expect(result).toContain('data-language="typescript"');
        expect(result).toContain('data-highlighted="shiki"');
    });
});
