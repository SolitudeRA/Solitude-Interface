/**
 * 单元测试模板
 *
 * 用法: 复制此文件到 src/api/__tests__/{category}/ 目录并重命名为 {module}.test.ts
 *
 * 功能:
 * - Vitest 测试框架
 * - Mock 数据示例
 * - 常用断言模式
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================================
// Mock 设置
// ============================================================

// Mock 外部依赖
vi.mock('@api/config/env', () => ({
    env: {
        ghost: {
            url: 'https://test.ghost.io',
            key: 'test-key',
            version: 'v5.0',
        },
        site: {
            url: 'https://test.site.com',
        },
    },
}));

// ============================================================
// 测试数据
// ============================================================

const mockData = {
    id: 'test-id-123',
    title: 'Test Title',
    slug: 'test-slug',
    created_at: '2024-01-01T00:00:00.000Z',
};

// ============================================================
// 测试套件
// ============================================================

describe('ModuleName', () => {
    beforeEach(() => {
        // 每个测试前的设置
        vi.clearAllMocks();
    });

    afterEach(() => {
        // 每个测试后的清理
    });

    // ----------------------------------------------------------
    // 功能测试组
    // ----------------------------------------------------------

    describe('functionName', () => {
        it('应该正确处理正常输入', () => {
            // Arrange (准备)
            const input = mockData;

            // Act (执行)
            const result = input.title;

            // Assert (断言)
            expect(result).toBe('Test Title');
        });

        it('应该处理空输入', () => {
            const input = null;
            expect(input).toBeNull();
        });

        it('应该处理边界情况', () => {
            const input = { ...mockData, title: '' };
            expect(input.title).toBe('');
        });
    });

    // ----------------------------------------------------------
    // 错误处理测试组
    // ----------------------------------------------------------

    describe('错误处理', () => {
        it('应该抛出预期的错误', () => {
            const throwError = () => {
                throw new Error('Expected error');
            };

            expect(throwError).toThrow('Expected error');
        });

        it('应该处理异步错误', async () => {
            const asyncThrow = async () => {
                throw new Error('Async error');
            };

            await expect(asyncThrow()).rejects.toThrow('Async error');
        });
    });

    // ----------------------------------------------------------
    // 异步操作测试组
    // ----------------------------------------------------------

    describe('异步操作', () => {
        it('应该正确解析 Promise', async () => {
            const asyncFn = async () => mockData;

            const result = await asyncFn();

            expect(result).toEqual(mockData);
        });
    });
});

// ============================================================
// 辅助函数 (测试专用)
// ============================================================

function createMockPost(overrides = {}) {
    return {
        id: 'mock-id',
        title: 'Mock Post',
        slug: 'mock-post',
        html: '<p>Content</p>',
        published_at: '2024-01-01T00:00:00.000Z',
        tags: [],
        ...overrides,
    };
}
