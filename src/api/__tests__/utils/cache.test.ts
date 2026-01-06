import { describe, it, expect, beforeEach } from 'vitest';
import {
    getCache,
    setCache,
    hasCache,
    deleteCache,
    clearCache,
    getCacheSize,
} from '@api/utils/cache';

describe('Build-time Cache', () => {
    beforeEach(() => {
        clearCache();
    });

    describe('setCache and getCache', () => {
        it('should store and retrieve data', () => {
            setCache('test-key', 'test-value');
            const result = getCache<string>('test-key');

            expect(result).toBe('test-value');
        });

        it('should store different types of data', () => {
            const testData = {
                id: 1,
                name: 'Test',
                items: [1, 2, 3],
            };

            setCache('object-key', testData);
            const result = getCache<typeof testData>('object-key');

            expect(result).toEqual(testData);
        });

        it('should return undefined when key does not exist', () => {
            const result = getCache('non-existent-key');

            expect(result).toBeUndefined();
        });

        it('should store different values for different keys', () => {
            setCache('key1', 'value1');
            setCache('key2', 'value2');

            expect(getCache('key1')).toBe('value1');
            expect(getCache('key2')).toBe('value2');
        });

        it('should correctly handle null values', () => {
            setCache('null-key', null);
            const result = getCache<null>('null-key');

            // 应该返回 null，而不是 undefined
            expect(result).toBeNull();
        });

        it('should distinguish between undefined (not cached) and null (cached null)', () => {
            // 未缓存的键返回 undefined
            expect(getCache('not-cached')).toBeUndefined();

            // 缓存 null 值
            setCache('cached-null', null);
            expect(getCache('cached-null')).toBeNull();
        });

        it('should overwrite existing value', () => {
            setCache('key', 'value1');
            setCache('key', 'value2');

            expect(getCache('key')).toBe('value2');
        });
    });

    describe('hasCache', () => {
        it('should return true when key exists', () => {
            setCache('test-key', 'test-value');

            expect(hasCache('test-key')).toBe(true);
        });

        it('should return false when key does not exist', () => {
            expect(hasCache('non-existent-key')).toBe(false);
        });

        it('should return true when value is null', () => {
            setCache('null-key', null);

            expect(hasCache('null-key')).toBe(true);
        });
    });

    describe('deleteCache', () => {
        it('should delete specified cache entry', () => {
            setCache('test-key', 'test-value');
            expect(hasCache('test-key')).toBe(true);

            deleteCache('test-key');
            expect(hasCache('test-key')).toBe(false);
        });

        it('should only delete specified key', () => {
            setCache('key1', 'value1');
            setCache('key2', 'value2');

            deleteCache('key1');

            expect(hasCache('key1')).toBe(false);
            expect(hasCache('key2')).toBe(true);
        });
    });

    describe('clearCache', () => {
        it('should clear all cache', () => {
            setCache('key1', 'value1');
            setCache('key2', 'value2');
            setCache('key3', 'value3');

            clearCache();

            expect(hasCache('key1')).toBe(false);
            expect(hasCache('key2')).toBe(false);
            expect(hasCache('key3')).toBe(false);
        });
    });

    describe('getCacheSize', () => {
        it('should return correct cache size', () => {
            expect(getCacheSize()).toBe(0);

            setCache('key1', 'value1');
            expect(getCacheSize()).toBe(1);

            setCache('key2', 'value2');
            expect(getCacheSize()).toBe(2);

            deleteCache('key1');
            expect(getCacheSize()).toBe(1);

            clearCache();
            expect(getCacheSize()).toBe(0);
        });
    });
});
