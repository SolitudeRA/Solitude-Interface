/**
 * URL 工具函数
 */

/**
 * 安全构造 URL:失败返回 null 而非抛出 TypeError。
 * 用于收敛来自 Ghost 等外部源的、不可信的 URL 字符串(可能畸形/为空)。
 * @param input - URL 字符串或 URL 对象
 * @param base - 可选基准 URL(用于相对路径)
 * @returns URL 对象,或在无效时返回 null
 */
export function safeCreateUrl(
    input: string | URL | undefined | null,
    base?: string | URL
): URL | null {
    if (!input) return null;
    try {
        return base !== undefined ? new URL(input, base) : new URL(input);
    } catch {
        console.warn(`[url] Failed to construct URL from: ${String(input)}`);
        return null;
    }
}

/**
 * 从 URL 中提取域名
 * @param url - 完整的 URL
 * @returns 域名或空字符串
 */
export function extractDomain(url: string | undefined): string {
    if (!url) return '';
    try {
        return new URL(url).hostname;
    } catch {
        console.warn(`[url] Invalid URL: ${url}`);
        return '';
    }
}

/**
 * 解析逗号分隔的 URL 字符串
 * @param urlString - 逗号分隔的 URL 字符串
 * @returns URL 数组
 */
export function parseUrlList(urlString: string | undefined): string[] {
    if (!urlString) return [];
    return urlString
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean);
}

/**
 * 从多个 URL 中批量提取域名（自动去重和过滤空值）
 * 支持单个 URL 或逗号分隔的多个 URL
 * @param urls - URL 字符串数组（每个字符串可以是逗号分隔的多个 URL）
 * @returns 去重后的域名数组
 */
export function extractDomains(...urls: (string | undefined)[]): string[] {
    const allUrls = urls.flatMap(parseUrlList);
    return [...new Set(allUrls.map(extractDomain).filter(Boolean))];
}
