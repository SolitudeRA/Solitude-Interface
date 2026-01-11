import {
    codeToHtml,
    bundledLanguages,
    type BundledLanguage,
    type SpecialLanguage,
} from 'shiki';

type SupportedLanguage = BundledLanguage | SpecialLanguage;

/**
 * 支持的编程语言列表
 * 只包含常用语言以优化打包体积
 */
const SUPPORTED_LANGUAGES = new Set<string>([
    // Web 前端
    'javascript',
    'typescript',
    'jsx',
    'tsx',
    'html',
    'css',
    'scss',
    'less',
    'json',
    'jsonc',
    'yaml',
    'toml',
    'xml',

    // 后端语言
    'python',
    'java',
    'kotlin',
    'go',
    'rust',
    'c',
    'cpp',
    'csharp',
    'php',
    'ruby',
    'swift',
    'scala',

    // Shell & DevOps
    'bash',
    'shell',
    'powershell',
    'dockerfile',
    'nginx',

    // 数据库 & 查询
    'sql',
    'graphql',

    // 标记语言
    'markdown',
    'mdx',
    'latex',

    // 配置文件
    'ini',
    'properties',
    'dotenv',

    // 其他
    'diff',
    'regex',
    'text',
    'plaintext',
]);

/**
 * 代码块正则表达式
 * 匹配 <pre><code class="language-xxx">...</code></pre> 格式
 */
const CODE_BLOCK_REGEX =
    /<pre[^>]*>\s*<code[^>]*class="[^"]*language-(\w+)[^"]*"[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi;

/**
 * 解码 HTML 实体
 */
function decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
        '&lt;': '<',
        '&gt;': '>',
        '&amp;': '&',
        '&quot;': '"',
        '&#39;': "'",
        '&#x27;': "'",
        '&nbsp;': ' ',
    };

    return text.replace(
        /&(?:lt|gt|amp|quot|#39|#x27|nbsp);/g,
        (match) => entities[match] || match,
    );
}

/**
 * 检查语言是否被支持
 */
function isSupportedLanguage(lang: string): boolean {
    const normalizedLang = lang.toLowerCase();
    return (
        SUPPORTED_LANGUAGES.has(normalizedLang) &&
        normalizedLang in bundledLanguages
    );
}

/**
 * 获取有效的语言标识
 * 如果语言不支持，返回 'plaintext'
 */
function getValidLanguage(lang: string): SupportedLanguage {
    const normalizedLang = lang.toLowerCase();

    // 语言别名映射
    const aliases: Record<string, string> = {
        js: 'javascript',
        ts: 'typescript',
        py: 'python',
        rb: 'ruby',
        sh: 'bash',
        zsh: 'bash',
        yml: 'yaml',
        md: 'markdown',
        cs: 'csharp',
        'c++': 'cpp',
        'c#': 'csharp',
        text: 'plaintext',
    };

    const resolvedLang = aliases[normalizedLang] || normalizedLang;

    if (isSupportedLanguage(resolvedLang)) {
        return resolvedLang as SupportedLanguage;
    }

    return 'plaintext';
}

/**
 * 高亮单个代码块
 */
async function highlightCode(
    code: string,
    lang: string,
): Promise<string | null> {
    try {
        const validLang = getValidLanguage(lang);
        const decodedCode = decodeHtmlEntities(code);

        const html = await codeToHtml(decodedCode, {
            lang: validLang,
            themes: {
                light: 'github-light',
                dark: 'github-dark',
            },
        });

        return html;
    } catch (error) {
        console.warn(`[codeHighlight] Failed to highlight ${lang}:`, error);
        return null;
    }
}

/**
 * 处理 HTML 中的所有代码块，进行语法高亮
 *
 * @param html - 原始 HTML 内容
 * @returns 高亮后的 HTML 内容
 *
 * @example
 * ```typescript
 * const html = '<pre><code class="language-typescript">const x = 1;</code></pre>';
 * const highlighted = await highlightCodeBlocks(html);
 * ```
 */
export async function highlightCodeBlocks(html: string): Promise<string> {
    if (!html) return html;

    // 收集所有匹配的代码块
    const matches: Array<{
        fullMatch: string;
        lang: string;
        code: string;
        index: number;
    }> = [];

    const regex = new RegExp(CODE_BLOCK_REGEX.source, 'gi');
    let match: RegExpExecArray | null;

    while ((match = regex.exec(html)) !== null) {
        const lang = match[1];
        const code = match[2];
        if (lang !== undefined && code !== undefined) {
            matches.push({
                fullMatch: match[0],
                lang,
                code,
                index: match.index,
            });
        }
    }

    if (matches.length === 0) {
        return html;
    }

    // 并行处理所有代码块
    const highlightedResults = await Promise.all(
        matches.map(async ({ lang, code }) => highlightCode(code, lang)),
    );

    // 从后向前替换（避免索引偏移问题）
    let result = html;
    for (let i = matches.length - 1; i >= 0; i--) {
        const matchItem = matches[i];
        const highlighted = highlightedResults[i];

        if (matchItem && highlighted) {
            const { fullMatch, lang } = matchItem;
            // 添加标记 class 表示已高亮
            const enhancedHtml = highlighted.replace(
                '<pre',
                `<pre data-language="${lang}" data-highlighted="shiki"`,
            );
            result = result.replace(fullMatch, enhancedHtml);
        }
    }

    return result;
}

/**
 * 检查 HTML 是否包含代码块
 */
export function hasCodeBlocks(html: string): boolean {
    return CODE_BLOCK_REGEX.test(html);
}
