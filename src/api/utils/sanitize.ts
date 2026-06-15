import DOMPurify, { type Config } from 'isomorphic-dompurify';

/**
 * DOMPurify 配置选项
 * 针对博客文章内容优化的白名单配置
 */
/**
 * data-* 白名单。原 `ALLOW_DATA_ATTR: true` 全局放行任意 data-*(含被污染内容注入的 data-xss);
 * 这里收敛为有限白名单:代码高亮/行号(data-language、data-line…)、文章增强(data-code-*)、
 * Ghost Koenig 卡片(data-kg-*)。其余 data-* 一律剔除。见下方 uponSanitizeAttribute 钩子。
 */
const ALLOWED_DATA_ATTR_EXACT = new Set([
    'data-language',
    'data-line',
    'data-lines',
    'data-highlighted',
]);
const ALLOWED_DATA_ATTR_PREFIXES = ['data-kg-', 'data-code-'] as const;

let dataAttrHookRegistered = false;
function ensureDataAttrAllowlistHook(): void {
    if (dataAttrHookRegistered) return;
    dataAttrHookRegistered = true;
    // ALLOW_DATA_ATTR 放行全部 data-*,再用钩子收敛到白名单(此模式比关 ALLOW_DATA_ATTR 更稳)
    DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
        const name = data.attrName;
        if (name?.startsWith('data-')) {
            const allowed =
                ALLOWED_DATA_ATTR_EXACT.has(name) ||
                ALLOWED_DATA_ATTR_PREFIXES.some((prefix) => name.startsWith(prefix));
            if (!allowed) data.keepAttr = false;
        }
    });
}

const SANITIZE_CONFIG: Config = {
    // 放行全部 data-*,再由 uponSanitizeAttribute 钩子收敛到 ALLOWED_DATA_ATTR_PREFIXES 白名单
    ALLOW_DATA_ATTR: true,

    // 允许的 HTML 标签 - 博客文章常用标签
    ALLOWED_TAGS: [
        // 文本结构
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'p',
        'br',
        'hr',
        'div',
        'span',

        // 文本格式
        'strong',
        'b',
        'em',
        'i',
        'u',
        's',
        'del',
        'ins',
        'mark',
        'small',
        'sub',
        'sup',

        // 链接和媒体
        'a',
        'img',
        'figure',
        'figcaption',
        'picture',
        'source',
        'video',
        'audio',
        'iframe',

        // 列表
        'ul',
        'ol',
        'li',
        'dl',
        'dt',
        'dd',

        // 表格
        'table',
        'thead',
        'tbody',
        'tfoot',
        'tr',
        'th',
        'td',
        'caption',
        'colgroup',
        'col',

        // 代码
        'pre',
        'code',
        'kbd',
        'samp',
        'var',

        // 引用
        'blockquote',
        'q',
        'cite',

        // 其他
        'abbr',
        'address',
        'time',
        'details',
        'summary',
    ],

    // 允许的属性
    ALLOWED_ATTR: [
        // 通用属性
        'id',
        'class',
        'style',
        'title',
        'lang',
        'dir',

        // 链接属性
        'href',
        'target',
        'rel',

        // 媒体属性
        'src',
        'srcset',
        'sizes',
        'alt',
        'width',
        'height',
        'loading',
        'decoding',

        // 视频/音频属性
        'controls',
        'autoplay',
        'loop',
        'muted',
        'poster',
        'preload',

        // iframe 属性 (用于嵌入视频等)
        'frameborder',
        'allowfullscreen',
        'allow',

        // 表格属性
        'colspan',
        'rowspan',
        'scope',

        // 时间属性
        'datetime',
        // 注: data-* 属性由 uponSanitizeAttribute 钩子按白名单放行(见顶部 ALLOWED_DATA_ATTR_*)
    ],

    // 允许的 URI 协议
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,

    // 安全设置
    FORBID_TAGS: ['script', 'style', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],

    // 保留 target="_blank" 时自动添加 rel="noopener noreferrer"
    ADD_ATTR: ['target'],

    // 返回字符串而非 TrustedHTML
    RETURN_TRUSTED_TYPE: false,
};

/**
 * 净化 HTML 内容
 * 移除潜在的 XSS 攻击向量，同时保留博客文章所需的格式
 *
 * @param html - 原始 HTML 字符串
 * @returns 净化后的安全 HTML 字符串
 */
export function sanitizeHtml(html: string): string {
    if (!html || typeof html !== 'string') {
        return '';
    }

    // 注册 data-* 白名单钩子(幂等),再净化
    ensureDataAttrAllowlistHook();
    const sanitized = DOMPurify.sanitize(html, SANITIZE_CONFIG);

    // 为外部链接添加安全属性
    return addSecurityToLinks(sanitized);
}

/**
 * 为外部链接添加安全属性
 * 添加 rel="noopener noreferrer" 防止 tabnapping 攻击
 */
function addSecurityToLinks(html: string): string {
    // 匹配 target="_blank" 的链接，如果没有 rel 属性则添加
    return html.replace(/<a\s+([^>]*target="_blank"[^>]*)>/gi, (match, attrs) => {
        if (!/rel=/.test(attrs)) {
            return `<a ${attrs} rel="noopener noreferrer">`;
        }
        // 如果已有 rel 属性，确保包含 noopener noreferrer
        return match.replace(/rel="([^"]*)"/i, (_relMatch, relValue: string) => {
            const values = new Set(relValue.split(/\s+/));
            values.add('noopener');
            values.add('noreferrer');
            return `rel="${Array.from(values).join(' ')}"`;
        });
    });
}

/**
 * 检查 HTML 是否包含潜在危险内容
 * 用于日志记录和监控
 *
 * @param html - 原始 HTML 字符串
 * @returns 是否包含可疑内容
 */
export function containsSuspiciousContent(html: string): boolean {
    if (!html) return false;

    const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i, // 事件处理器
        /data:text\/html/i,
        /<iframe[^>]*src\s*=\s*["'][^"']*(?!youtube|vimeo|bilibili)/i,
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(html));
}
