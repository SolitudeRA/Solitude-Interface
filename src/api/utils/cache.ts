/**
 * 极简构建时缓存
 *
 * 专为 Astro SSG 构建优化设计：
 * - 无 TTL（构建是一次性的，不需要过期机制）
 * - 无单例模式（简化代码）
 * - 使用 undefined 区分"未缓存"和"缓存值为 null"
 *
 * 主要用途：
 * - 避免构建时重复的 Ghost API 调用
 * - 缓存 initializeSiteData() 等被多个页面调用的函数结果
 */

const cache = new Map<string, unknown>();

/**
 * 获取缓存项
 * @param key 缓存键
 * @returns 缓存的数据，如果不存在则返回 undefined
 */
export function getCache<T>(key: string): T | undefined {
    if (!cache.has(key)) {
        return undefined;
    }
    return cache.get(key) as T;
}

/**
 * 设置缓存项
 * @param key 缓存键
 * @param value 要缓存的数据（可以是 null）
 */
export function setCache<T>(key: string, value: T): void {
    cache.set(key, value);
}

/**
 * 检查缓存项是否存在
 * @param key 缓存键
 */
export function hasCache(key: string): boolean {
    return cache.has(key);
}

/**
 * 删除缓存项
 * @param key 缓存键
 */
export function deleteCache(key: string): void {
    cache.delete(key);
}

/**
 * 清空所有缓存
 */
export function clearCache(): void {
    cache.clear();
}

/**
 * 获取当前缓存大小（用于调试）
 */
export function getCacheSize(): number {
    return cache.size;
}
