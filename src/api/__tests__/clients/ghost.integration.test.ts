import { describe, it, expect } from 'vitest';
import { GhostAPIClient } from '@api/clients/ghost';
import '../setup.integration';

describe('GhostAPIClient Integration Tests', () => {
    const client = new GhostAPIClient();

    describe('Real API Connection', () => {
        it('should successfully connect to Ghost API and fetch posts', async () => {
            const result = await client.get({
                endpoint: '/posts/',
                params: {
                    limit: 1,
                    fields: 'id,title,url',
                },
            });

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            
            if (result.length > 0) {
                expect(result[0]).toHaveProperty('id');
                expect(result[0]).toHaveProperty('title');
                expect(result[0]).toHaveProperty('url');
            }
        }, 10000); // 10秒超时

        it('should successfully fetch site settings', async () => {
            const result = await client.get({
                endpoint: '/settings/',
            });

            expect(result).toBeDefined();
            expect(result).toHaveProperty('title');
            expect(result).toHaveProperty('description');
        }, 10000);

        it('should handle query parameters correctly', async () => {
            const result = await client.get({
                endpoint: '/posts/',
                params: {
                    limit: 5,
                    fields: 'id,title',
                    include: 'tags',
                },
            });

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeLessThanOrEqual(5);
            
            if (result.length > 0) {
                expect(result[0]).toHaveProperty('id');
                expect(result[0]).toHaveProperty('title');
                // 如果文章有标签，应该包含 tags
                if (result[0].tags) {
                    expect(Array.isArray(result[0].tags)).toBe(true);
                }
            }
        }, 10000);

        it('should throw error for invalid endpoint', async () => {
            await expect(
                client.get({
                    endpoint: '/invalid-endpoint/',
                }),
            ).rejects.toThrow();
        }, 10000);

        it('should handle network errors gracefully', async () => {
            // 使用无效参数触发错误
            await expect(
                client.get({
                    endpoint: '/posts/',
                    params: {
                        limit: 'invalid', // 无效的 limit 参数
                    },
                }),
            ).rejects.toThrow();
        }, 10000);
    });

    describe('API Response Structure', () => {
        it('should return posts with correct structure', async () => {
            const result = await client.get({
                endpoint: '/posts/',
                params: {
                    limit: 1,
                },
            });

            if (result.length > 0) {
                const post = result[0];
                
                // 验证必需字段
                expect(post).toHaveProperty('id');
                expect(typeof post.id).toBe('string');
                
                expect(post).toHaveProperty('title');
                expect(typeof post.title).toBe('string');
                
                expect(post).toHaveProperty('url');
                expect(typeof post.url).toBe('string');
                
                expect(post).toHaveProperty('published_at');
            }
        }, 10000);

        it('should return settings with correct structure', async () => {
            const result = await client.get({
                endpoint: '/settings/',
            });

            // 验证站点设置必需字段
            expect(result).toHaveProperty('title');
            expect(typeof result.title).toBe('string');
            
            expect(result).toHaveProperty('description');
            expect(typeof result.description).toBe('string');
            
            // 可选字段验证（如果存在）
            if (result.timezone) {
                expect(typeof result.timezone).toBe('string');
            }
            
            if (result.logo) {
                expect(typeof result.logo).toBe('string');
            }
        }, 10000);
    });

    describe('API Performance', () => {
        it('should complete request within reasonable time', async () => {
            const startTime = Date.now();
            
            await client.get({
                endpoint: '/posts/',
                params: {
                    limit: 3,
                },
            });
            
            const duration = Date.now() - startTime;
            
            // 请求应该在5秒内完成
            expect(duration).toBeLessThan(5000);
        }, 10000);
    });
});
