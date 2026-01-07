import { useEffect } from 'react';
import { codeToHtml, bundledLanguages } from 'shiki';

/**
 * 代码高亮组件 - 使用 Shiki 在客户端高亮代码块
 * 支持亮/暗双主题切换
 */
export default function CodeHighlighter() {
    useEffect(() => {
        const highlightCodeBlocks = async () => {
            // 获取所有未高亮的代码块
            const codeBlocks = document.querySelectorAll(
                '.solitude-article-content pre code:not([data-highlighted])',
            );

            if (codeBlocks.length === 0) return;

            for (const block of codeBlocks) {
                // 标记为已处理，避免重复高亮
                block.setAttribute('data-highlighted', 'true');

                // 从 class 中提取语言，如 "language-typescript"
                const langMatch = block.className.match(/language-(\w+)/);
                const lang = langMatch?.[1] || 'text';
                const code = block.textContent || '';

                try {
                    // 检查语言是否支持
                    const supportedLang =
                        lang in bundledLanguages ? lang : 'text';

                    const html = await codeToHtml(code, {
                        lang: supportedLang,
                        themes: {
                            light: 'github-light',
                            dark: 'github-dark',
                        },
                    });

                    // 替换原始的 pre 元素
                    const parent = block.parentElement;
                    if (parent && parent.tagName === 'PRE') {
                        // 创建临时容器解析 HTML
                        const temp = document.createElement('div');
                        temp.innerHTML = html;
                        const newPre = temp.firstElementChild;

                        if (newPre) {
                            // 保留原始 class
                            newPre.classList.add('shiki-highlighted');
                            parent.replaceWith(newPre);
                        }
                    }
                } catch (error) {
                    console.warn(
                        `Failed to highlight code block with language: ${lang}`,
                        error,
                    );
                }
            }
        };

        highlightCodeBlocks();
    }, []);

    return null;
}
