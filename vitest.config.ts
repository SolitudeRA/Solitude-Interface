import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    // 使用 vite-tsconfig-paths 插件自动读取 tsconfig.json 的 paths 配置
    plugins: [tsconfigPaths()],
    // 服务器配置 - 使用 IPv4 地址避免 Windows 上的权限问题
    server: {
        host: '127.0.0.1',
    },
    test: {
        // API 服务器配置 - 使用不在 Windows 排除范围内的端口
        api: {
            host: '127.0.0.1',
            port: 51400,
        },
        globals: true,
        environment: 'node',
        setupFiles: ['./src/api/__tests__/setup.ts'],
        // 排除集成测试 - 集成测试需要真实环境变量，需单独运行
        exclude: ['**/*.integration.test.ts', '**/node_modules/**'],
        // 增加测试的默认超时时间
        testTimeout: 15000,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/api/**/*.ts'],
            exclude: [
                'src/api/**/*.test.ts',
                'src/api/**/*.integration.test.ts',
                'src/api/__tests__/**',
                'src/api/config/env.ts',
                'src/api/ghost/types.ts',
            ],
        },
    },
});
