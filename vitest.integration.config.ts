import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

/**
 * 集成测试配置(与单测分离):只跑 *.integration.test.ts,打真实/demo Ghost。
 * 用 setup.integration.ts 从 process.env 取 Ghost 配置。CI 中作为非阻塞 job 运行,
 * 用于尽早暴露 Ghost API 契约变更,而非等到生产构建。
 */
export default defineConfig({
    plugins: [tsconfigPaths()],
    server: {
        host: '127.0.0.1',
    },
    test: {
        api: {
            host: '127.0.0.1',
            port: 51401,
        },
        globals: true,
        environment: 'node',
        setupFiles: ['./src/api/__tests__/setup.integration.ts'],
        include: ['**/*.integration.test.ts'],
        testTimeout: 20000,
    },
});
