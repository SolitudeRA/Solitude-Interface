import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./src/api/__tests__/setup.ts'],
        // 增加集成测试的默认超时时间
        testTimeout: 15000,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/api/**/*.ts'],
            exclude: [
                'src/api/**/*.test.ts',
                'src/api/**/*.integration.test.ts', // 排除集成测试
                'src/api/__tests__/**',
                'src/api/config/env.ts', // 环境配置文件通常不需要测试
                'src/api/ghost/types.ts', // 类型定义文件不需要测试
            ],
        },
    },
    resolve: {
        alias: {
            '@api': path.resolve(__dirname, './src/api'),
        },
    },
});
