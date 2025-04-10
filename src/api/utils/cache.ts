interface CacheItem<T> {
    data: T;
    expiry: number; // 过期时间戳
}

export class CacheService {
    private static instance: CacheService;
    private cache = new Map<string, CacheItem<unknown>>();
    
    // 默认缓存时间（毫秒）
    private defaultTTL = 5 * 60 * 1000; // 5分钟
    
    /**
     * 获取CacheService单例
     */
    public static getInstance(): CacheService {
        if (!CacheService.instance) {
            CacheService.instance = new CacheService();
        }
        return CacheService.instance;
    }
    
    /**
     * 设置缓存项
     * @param key 缓存键
     * @param data 要缓存的数据
     * @param ttl 生存时间（毫秒），默认5分钟
     */
    public set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
        const expiry = Date.now() + ttl;
        this.cache.set(key, { data, expiry });
    }
    
    /**
     * 获取缓存项
     * @param key 缓存键
     * @returns 缓存的数据，如果不存在或已过期则返回null
     */
    public get<T>(key: string): T | null {
        const item = this.cache.get(key) as CacheItem<T> | undefined;
        
        // 如果缓存不存在
        if (!item) {
            return null;
        }
        
        // 如果缓存已过期
        if (Date.now() > item.expiry) {
            this.delete(key);
            return null;
        }
        
        return item.data;
    }
    
    /**
     * 检查缓存项是否存在且未过期
     * @param key 缓存键
     * @returns 是否存在有效缓存
     */
    public has(key: string): boolean {
        const item = this.cache.get(key);
        if (!item) {
            return false;
        }
        
        if (Date.now() > item.expiry) {
            this.delete(key);
            return false;
        }
        
        return true;
    }
    
    /**
     * 删除缓存项
     * @param key 缓存键
     */
    public delete(key: string): void {
        this.cache.delete(key);
    }
    
    /**
     * 清空所有缓存
     */
    public clear(): void {
        this.cache.clear();
    }
    
    /**
     * 清理所有过期的缓存项
     * @returns 清理的缓存项数量
     */
    public cleanExpired(): number {
        const now = Date.now();
        let cleanedCount = 0;
        
        this.cache.forEach((item, key) => {
            if (now > item.expiry) {
                this.cache.delete(key);
                cleanedCount++;
            }
        });
        
        return cleanedCount;
    }
    
    /**
     * 设置默认的缓存时间
     * @param ttl 默认生存时间（毫秒）
     */
    public setDefaultTTL(ttl: number): void {
        this.defaultTTL = ttl;
    }
}

// 导出单例实例，方便直接使用
export const cacheService = CacheService.getInstance();

/**
 * 缓存包装函数
 * 用于给异步函数添加缓存功能
 * 
 * @param fn 要缓存的原始函数
 * @param keyPrefix 缓存键前缀
 * @param ttl 缓存生存时间（毫秒），不指定则使用默认值
 * @returns 包装后的带缓存功能的函数
 */
export function withCache<T, Args extends any[]>(
    fn: (...args: Args) => Promise<T>,
    keyPrefix: string,
    ttl?: number
): (...args: Args) => Promise<T> {
    return async function(...args: Args): Promise<T> {
        // 生成缓存键：前缀 + 参数JSON字符串
        const cacheKey = `${keyPrefix}:${JSON.stringify(args)}`;
        
        // 查询缓存
        const cachedResult = cacheService.get<T>(cacheKey);
        if (cachedResult !== null) {
            return cachedResult;
        }
        
        // 执行原始函数
        const result = await fn(...args);
        
        // 缓存结果
        cacheService.set(cacheKey, result, ttl);
        
        return result;
    };
}
