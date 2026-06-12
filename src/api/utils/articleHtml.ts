export interface CodeBlockLabels {
    wrap: string;
    scroll: string;
    copy: string;
    copied: string;
    failed: string;
    expand: string;
    collapse: string;
}

export const DEFAULT_CODE_BLOCK_LABELS: CodeBlockLabels = {
    wrap: 'Wrap',
    scroll: 'Scroll',
    copy: 'Copy',
    copied: 'Copied',
    failed: 'Failed',
    expand: 'Show more',
    collapse: 'Show less',
};

const PRE_BLOCK_REGEX = /<pre\b([^>]*)>([\s\S]*?)<\/pre>/gi;
const TABLE_REGEX = /<table\b([^>]*)>([\s\S]*?)<\/table>/gi;
const LONG_CODE_LINE_THRESHOLD = 9;
const DEFAULT_TABLE_REGION_LABEL = 'Scrollable table';
const WRAPPED_CODE_LANGUAGES = new Set([
    'conf',
    'config',
    'dockerfile',
    'env',
    'ini',
    'json',
    'nginx',
    'properties',
    'toml',
    'xml',
    'yaml',
    'yml',
]);
const TERMINAL_CODE_LANGUAGES = new Set([
    'bash',
    'console',
    'fish',
    'powershell',
    'ps1',
    'shell',
    'sh',
    'terminal',
    'zsh',
]);

function escapeHtmlText(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function readAttribute(attrs: string, name: string): string | null {
    const quoted = new RegExp(`${name}\\s*=\\s*(['"])(.*?)\\1`, 'i').exec(attrs);
    if (quoted?.[2]) return quoted[2];

    const unquoted = new RegExp(`${name}\\s*=\\s*([^\\s>]+)`, 'i').exec(attrs);
    return unquoted?.[1] ?? null;
}

function decodeCodeText(value: string): string {
    return value
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)))
        .replace(/&#x([0-9a-f]+);/gi, (_match, code: string) =>
            String.fromCodePoint(Number.parseInt(code, 16))
        );
}

function extractLanguageFromAttrs(attrs: string): string | null {
    const dataLanguage = readAttribute(attrs, 'data-language');
    if (dataLanguage) return dataLanguage;

    const className = readAttribute(attrs, 'class');
    const languageMatch = className?.match(/language-([a-z0-9_+#-]+)/i);

    return languageMatch?.[1] ?? null;
}

function extractCodeLanguage(preAttrs: string, preInnerHtml: string): string {
    const preLanguage = extractLanguageFromAttrs(preAttrs);
    if (preLanguage) return preLanguage.replace(/_/g, ' ');

    const codeAttrs = preInnerHtml.match(/<code\b([^>]*)>/i)?.[1];
    const codeLanguage = codeAttrs ? extractLanguageFromAttrs(codeAttrs) : null;

    return codeLanguage?.replace(/_/g, ' ') ?? 'code';
}

function normalizeLanguageName(value: string): string {
    return value.toLowerCase().replace(/\s+/g, '-');
}

function countCodeLines(preInnerHtml: string): number {
    const text = decodeCodeText(preInnerHtml).replace(/\r\n?/g, '\n');
    if (!text) return 1;

    return text.split('\n').length;
}

export function normalizeArticleHeadingHierarchy(html: string): string {
    return html.replace(/<h1\b([^>]*)>/gi, '<h2$1>').replace(/<\/h1>/gi, '</h2>');
}

export function enhanceArticleCodeBlocks(
    html: string,
    labels: CodeBlockLabels = DEFAULT_CODE_BLOCK_LABELS
): string {
    let codeBlockIndex = 0;

    return html.replace(PRE_BLOCK_REGEX, (_match, attrs: string, innerHtml: string) => {
        codeBlockIndex += 1;

        const rawLanguage = extractCodeLanguage(attrs, innerHtml);
        const normalizedLanguage = normalizeLanguageName(rawLanguage);
        const language = escapeHtmlText(rawLanguage.toUpperCase());
        const lineCount = countCodeLines(innerHtml);
        const shouldWrapByDefault =
            WRAPPED_CODE_LANGUAGES.has(normalizedLanguage) &&
            !TERMINAL_CODE_LANGUAGES.has(normalizedLanguage);
        const isLongCode = lineCount > LONG_CODE_LINE_THRESHOLD;
        const wrapLabel = escapeHtmlText(labels.wrap);
        const scrollLabel = escapeHtmlText(labels.scroll);
        const copyLabel = escapeHtmlText(labels.copy);
        const expandLabel = escapeHtmlText(labels.expand);
        const shellClasses = [
            'code-block-shell',
            shouldWrapByDefault ? 'is-wrapped' : '',
            isLongCode ? 'is-collapsed' : '',
            TERMINAL_CODE_LANGUAGES.has(normalizedLanguage) ? 'is-terminal' : '',
        ]
            .filter(Boolean)
            .join(' ');

        return [
            `<div class="${shellClasses}" data-code-block="${codeBlockIndex}" data-code-lines="${lineCount}">`,
            '<div class="code-block-toolbar">',
            `<span class="code-block-language">${language}</span>`,
            '<div class="code-block-actions">',
            isLongCode
                ? `<button type="button" class="code-block-action" data-code-toggle-lines aria-expanded="false" aria-label="${expandLabel}" title="${expandLabel}">${expandLabel}</button>`
                : '',
            `<button type="button" class="code-block-action" data-code-wrap aria-label="${shouldWrapByDefault ? scrollLabel : wrapLabel}" title="${shouldWrapByDefault ? scrollLabel : wrapLabel}">${shouldWrapByDefault ? scrollLabel : wrapLabel}</button>`,
            `<button type="button" class="code-block-action" data-code-copy aria-label="${copyLabel}" title="${copyLabel}">${copyLabel}</button>`,
            '</div>',
            '</div>',
            `<pre${attrs}>${innerHtml}</pre>`,
            '<span class="code-block-status sr-only" data-code-status aria-live="polite"></span>',
            '</div>',
        ].join('');
    });
}

export function wrapArticleTables(html: string, regionLabel = DEFAULT_TABLE_REGION_LABEL): string {
    const label = escapeHtmlText(regionLabel);

    return html.replace(TABLE_REGEX, (_match, attrs: string, innerHtml: string) =>
        [
            `<div class="article-table-scroll" role="region" aria-label="${label}" tabindex="0">`,
            `<table${attrs}>${innerHtml}</table>`,
            '</div>',
        ].join('')
    );
}

export function prepareArticleHtml(
    html: string,
    labels: CodeBlockLabels = DEFAULT_CODE_BLOCK_LABELS,
    tableRegionLabel = DEFAULT_TABLE_REGION_LABEL
): string {
    return wrapArticleTables(
        enhanceArticleCodeBlocks(normalizeArticleHeadingHierarchy(html), labels),
        tableRegionLabel
    );
}
