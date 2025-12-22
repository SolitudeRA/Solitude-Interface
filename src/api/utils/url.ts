/**
 * URL 工具函数
 */

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
