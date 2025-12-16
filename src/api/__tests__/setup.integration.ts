import { beforeEach, afterEach } from 'vitest';
import { cacheService } from '@api/utils/cache';

// 集成测试设置 - 不 mock 环境变量和 API 客户端
// 使用真实的 .env 配置进行测试

// 每个测试前清除缓存，确保测试独立性
beforeEach(() => {
    cacheService.clear();
});

// 每个测试后也清除缓存
afterEach(() => {
    cacheService.clear();
});
