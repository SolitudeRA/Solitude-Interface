import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CacheService, cacheService, withCache } from '@api/utils/cache';

describe('CacheService', () => {
    let service: CacheService;

    beforeEach(() => {
        service = CacheService.getInstance();
        service.clear();
        vi.clearAllMocks();
    });

    describe('getInstance', () => {
        it('should return singleton instance', () => {
            const instance1 = CacheService.getInstance();
            const instance2 = CacheService.getInstance();

            expect(instance1).toBe(instance2);
        });
    });

    describe('set and get', () => {
        it('should store and retrieve data', () => {
            service.set('test-key', 'test-value');
            const result = service.get<string>('test-key');

            expect(result).toBe('test-value');
        });

        it('should store different types of data', () => {
            const testData = {
                id: 1,
                name: 'Test',
                items: [1, 2, 3],
            };

            service.set('object-key', testData);
            const result = service.get<typeof testData>('object-key');

            expect(result).toEqual(testData);
        });

        it('should return null when key does not exist', () => {
            const result = service.get('non-existent-key');

            expect(result).toBeNull();
        });

        it('should store different values for different keys', () => {
            service.set('key1', 'value1');
            service.set('key2', 'value2');

            expect(service.get('key1')).toBe('value1');
            expect(service.get('key2')).toBe('value2');
        });
    });

    describe('TTL (Time To Live)', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should return null after TTL expires', () => {
            service.set('test-key', 'test-value', 1000); // 1 second TTL

            // Should succeed immediately
            expect(service.get('test-key')).toBe('test-value');

            // Should expire after 1 second
            vi.advanceTimersByTime(1001);
            expect(service.get('test-key')).toBeNull();
        });

        it('should use default TTL', () => {
            service.set('test-key', 'test-value'); // Use default TTL (5 minutes)

            // Still valid after 4 minutes 59 seconds
            vi.advanceTimersByTime(4 * 60 * 1000 + 59 * 1000);
            expect(service.get('test-key')).toBe('test-value');

            // Expires after 5 minutes
            vi.advanceTimersByTime(2000);
            expect(service.get('test-key')).toBeNull();
        });

        it('should allow updating default TTL', () => {
            service.setDefaultTTL(2000); // Set to 2 seconds
            service.set('test-key', 'test-value');

            vi.advanceTimersByTime(1900);
            expect(service.get('test-key')).toBe('test-value');

            vi.advanceTimersByTime(200);
            expect(service.get('test-key')).toBeNull();
        });
    });

    describe('has', () => {
        it('should return true when key exists and not expired', () => {
            service.set('test-key', 'test-value');

            expect(service.has('test-key')).toBe(true);
        });

        it('should return false when key does not exist', () => {
            expect(service.has('non-existent-key')).toBe(false);
        });

        it('should return false after key expires', () => {
            vi.useFakeTimers();
            service.set('test-key', 'test-value', 1000);

            expect(service.has('test-key')).toBe(true);

            vi.advanceTimersByTime(1001);
            expect(service.has('test-key')).toBe(false);

            vi.useRealTimers();
        });
    });

    describe('delete', () => {
        it('should delete specified cache entry', () => {
            service.set('test-key', 'test-value');
            expect(service.has('test-key')).toBe(true);

            service.delete('test-key');
            expect(service.has('test-key')).toBe(false);
        });

        it('should only delete specified key', () => {
            service.set('key1', 'value1');
            service.set('key2', 'value2');

            service.delete('key1');

            expect(service.has('key1')).toBe(false);
            expect(service.has('key2')).toBe(true);
        });
    });

    describe('clear', () => {
        it('should clear all cache', () => {
            service.set('key1', 'value1');
            service.set('key2', 'value2');
            service.set('key3', 'value3');

            service.clear();

            expect(service.has('key1')).toBe(false);
            expect(service.has('key2')).toBe(false);
            expect(service.has('key3')).toBe(false);
        });
    });

    describe('cleanExpired', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should clean all expired cache entries', () => {
            service.set('key1', 'value1', 1000);
            service.set('key2', 'value2', 2000);
            service.set('key3', 'value3', 3000);

            vi.advanceTimersByTime(1500);
            const cleanedCount = service.cleanExpired();

            expect(cleanedCount).toBe(1);
            expect(service.has('key1')).toBe(false);
            expect(service.has('key2')).toBe(true);
            expect(service.has('key3')).toBe(true);
        });

        it('should return count of cleaned cache entries', () => {
            service.set('key1', 'value1', 1000);
            service.set('key2', 'value2', 1000);
            service.set('key3', 'value3', 5000);

            vi.advanceTimersByTime(1001);
            const cleanedCount = service.cleanExpired();

            expect(cleanedCount).toBe(2);
        });

        it('should return 0 when no expired entries', () => {
            service.set('key1', 'value1', 5000);
            service.set('key2', 'value2', 5000);

            const cleanedCount = service.cleanExpired();

            expect(cleanedCount).toBe(0);
        });
    });
});

describe('cacheService', () => {
    it('should export singleton instance', () => {
        expect(cacheService).toBeInstanceOf(CacheService);
        expect(cacheService).toBe(CacheService.getInstance());
    });
});

describe('withCache', () => {
    beforeEach(() => {
        cacheService.clear();
        vi.clearAllMocks();
    });

    it('should cache function results', async () => {
        const mockFn = vi.fn().mockResolvedValue('result');
        const cachedFn = withCache(mockFn, 'test-prefix');

        const result1 = await cachedFn('arg1', 'arg2');
        const result2 = await cachedFn('arg1', 'arg2');

        expect(result1).toBe('result');
        expect(result2).toBe('result');
        expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should create different cache keys for different arguments', async () => {
        const mockFn = vi.fn((x: number) => Promise.resolve(x * 2));
        const cachedFn = withCache(mockFn, 'multiply');

        await cachedFn(5);
        await cachedFn(10);

        expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should generate cache key using prefix and arguments', async () => {
        const mockFn = vi.fn().mockResolvedValue('result');
        const cachedFn = withCache(mockFn, 'test-prefix');

        await cachedFn('arg1', 'arg2');

        expect(
            cacheService.has('test-prefix:["arg1","arg2"]'),
        ).toBe(true);
    });

    it('should support custom TTL', async () => {
        vi.useFakeTimers();

        const mockFn = vi.fn().mockResolvedValue('result');
        const cachedFn = withCache(mockFn, 'test-prefix', 2000);

        await cachedFn('arg');
        vi.advanceTimersByTime(1500);

        await cachedFn('arg');
        expect(mockFn).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(600);
        await cachedFn('arg');
        expect(mockFn).toHaveBeenCalledTimes(2);

        vi.useRealTimers();
    });

    it('should handle complex argument types', async () => {
        const mockFn = vi.fn((obj: { id: number; name: string }) =>
            Promise.resolve(`Result: ${obj.id}`),
        );
        const cachedFn = withCache(mockFn, 'complex');

        const arg = { id: 123, name: 'test' };
        const result1 = await cachedFn(arg);
        // 第二次调用应该使用缓存
        await cachedFn(arg);

        expect(result1).toBe('Result: 123');
        expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle functions without arguments', async () => {
        const mockFn = vi.fn().mockResolvedValue('no-args-result');
        const cachedFn = withCache(mockFn, 'no-args');

        await cachedFn();
        await cachedFn();

        expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should pass all arguments to original function', async () => {
        const mockFn = vi.fn((a: string, b: number, c: boolean) =>
            Promise.resolve(`${a}-${b}-${c}`),
        );
        const cachedFn = withCache(mockFn, 'test');

        await cachedFn('test', 42, true);

        expect(mockFn).toHaveBeenCalledWith('test', 42, true);
    });

    it('should propagate errors when original function throws', async () => {
        const mockFn = vi.fn().mockRejectedValue(new Error('Test error'));
        const cachedFn = withCache(mockFn, 'error-test');

        await expect(cachedFn('arg')).rejects.toThrow('Test error');
    });

    it('should not cache result after error', async () => {
        const mockFn = vi
            .fn()
            .mockRejectedValueOnce(new Error('First call error'))
            .mockResolvedValueOnce('success');

        const cachedFn = withCache(mockFn, 'retry-test');

        await expect(cachedFn('arg')).rejects.toThrow('First call error');
        const result = await cachedFn('arg');

        expect(result).toBe('success');
        expect(mockFn).toHaveBeenCalledTimes(2);
    });
});
