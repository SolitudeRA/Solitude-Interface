import { beforeEach, vi } from 'vitest';

// Mock环境变量
vi.mock('@api/config/env', () => ({
    env: {
        ghost: {
            url: 'https://test-ghost.example.com',
            key: 'test-ghost-api-key',
            version: 'v5.0',
            accessId: 'test-access-id',
            accessSecret: 'test-access-secret',
        },
        workers: {
            resource: {
                url: 'test-resource-workers.example.com',
            },
        },
        site: {
            url: 'https://test-site.example.com',
        },
    },
}));

// 每个测试前重置所有mock
beforeEach(() => {
    vi.clearAllMocks();
});
