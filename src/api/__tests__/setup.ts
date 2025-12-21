import { beforeEach, vi } from 'vitest';

// 为单元测试 Mock 环境变量
// 集成测试文件（*.integration.test.ts）会在各自文件中覆盖这些配置
vi.mock('@api/config/env', () => ({
    env: {
        ghost: {
            url: 'https://test-ghost.example.com',
            key: 'test-ghost-api-key',
            version: 'v5.0',
        },
        site: {
            url: 'https://test-site.example.com',
        },
    },
}));

// 每个测试前重置
beforeEach(() => {
    vi.clearAllMocks();
});
