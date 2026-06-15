import { beforeEach, vi } from 'vitest';

/**
 * 集成测试专用 setup:与单测不同,这里不 mock 成假 Ghost,而是用真实环境变量
 * (CI 中由 workflow 注入 demo Ghost;本地未设则回退 demo.ghost.io)。
 * 仍 mock `@api/config/env` —— 因为 `astro:env/server` 虚拟模块在 vitest 下无法解析,
 * 但取值来自 process.env,使集成测试真正打到目标 Ghost。
 */
vi.mock('@api/config/env', () => ({
    env: {
        ghost: {
            url: process.env.GHOST_URL ?? 'https://demo.ghost.io',
            key: process.env.GHOST_CONTENT_KEY ?? '22444f78447824223cefc48062',
            version: process.env.GHOST_VERSION ?? 'v5.0',
            timeout: Number(process.env.GHOST_TIMEOUT ?? 5000),
        },
        site: {
            url: process.env.SITE_URL ?? 'https://example.com',
        },
        image: {
            imageHostUrl: process.env.IMAGE_HOST_URL ?? '',
        },
        cloudflare: {
            accessClientId: process.env.CF_ACCESS_CLIENT_ID ?? '',
            accessClientSecret: process.env.CF_ACCESS_CLIENT_SECRET ?? '',
        },
    },
}));

beforeEach(() => {
    vi.clearAllMocks();
});
