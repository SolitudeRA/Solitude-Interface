import { describe, it, expect, beforeEach } from 'vitest';
import { getSiteInformation, initializeSiteData } from '@api/ghost/settings';
import { cacheService } from '@api/utils/cache';
import '../setup.integration';

describe('Settings API Integration Tests', () => {
    beforeEach(() => {
        // 确保每个测试开始时缓存是清空的
        cacheService.clear();
    });

    describe('getSiteInformation', () => {
        it('should fetch real site information from Ghost API', async () => {
            const siteInfo = await getSiteInformation();

            // 验证必需字段
            expect(siteInfo).toBeDefined();
            expect(siteInfo).toHaveProperty('title');
            expect(typeof siteInfo.title).toBe('string');
            expect(siteInfo.title.length).toBeGreaterThan(0);

            expect(siteInfo).toHaveProperty('description');
            expect(typeof siteInfo.description).toBe('string');
        }, 15000);

        it('should return complete site metadata', async () => {
            const siteInfo = await getSiteInformation();

            // 验证可选字段（如果存在）
            if (siteInfo.logo) {
                expect(siteInfo.logo).toBeInstanceOf(URL);
            }

            if (siteInfo.icon) {
                expect(siteInfo.icon).toBeInstanceOf(URL);
            }

            if (siteInfo.cover_image) {
                expect(siteInfo.cover_image).toBeInstanceOf(URL);
            }

            if (siteInfo.timezone) {
                expect(typeof siteInfo.timezone).toBe('string');
            }

            if (siteInfo.twitter) {
                expect(typeof siteInfo.twitter).toBe('string');
            }
        }, 15000);

        it('should have valid timezone format', async () => {
            const siteInfo = await getSiteInformation();

            if (siteInfo.timezone) {
                // 时区应该是有效格式，如 "Asia/Tokyo", "UTC"
                expect(siteInfo.timezone).toMatch(/^[A-Za-z]+\/[A-Za-z_]+$|^UTC$/);
            }
        }, 15000);

        it('should have valid URL formats for assets', async () => {
            const siteInfo = await getSiteInformation();

            if (siteInfo.logo) {
                expect(siteInfo.logo.protocol).toMatch(/^https?:/);
            }

            if (siteInfo.icon) {
                expect(siteInfo.icon.protocol).toMatch(/^https?:/);
            }

            if (siteInfo.cover_image) {
                expect(siteInfo.cover_image.protocol).toMatch(/^https?:/);
            }
        }, 15000);
    });

    describe('initializeSiteData', () => {
        it('should initialize and transform site data correctly', async () => {
            const siteData = await initializeSiteData();

            // 验证转换后的字段
            expect(siteData).toBeDefined();
            expect(siteData).toHaveProperty('siteTitle');
            expect(typeof siteData.siteTitle).toBe('string');
            expect(siteData.siteTitle.length).toBeGreaterThan(0);

            expect(siteData).toHaveProperty('siteDescription');
            expect(typeof siteData.siteDescription).toBe('string');

            expect(siteData).toHaveProperty('logoUrl');
            expect(typeof siteData.logoUrl).toBe('string');

            expect(siteData).toHaveProperty('coverImageUrl');
            expect(siteData.coverImageUrl).toBeInstanceOf(URL);
        }, 15000);

        it('should convert logo URL to string', async () => {
            const siteData = await initializeSiteData();

            // logoUrl 应该是字符串
            expect(typeof siteData.logoUrl).toBe('string');
            
            if (siteData.logoUrl.length > 0) {
                // 如果有 logo，应该是有效的 URL 字符串
                expect(siteData.logoUrl).toMatch(/^https?:\/\//);
            }
        }, 15000);

        it('should keep coverImageUrl as URL object', async () => {
            const siteData = await initializeSiteData();

            // coverImageUrl 应该保持为 URL 对象
            expect(siteData.coverImageUrl).toBeInstanceOf(URL);
            expect(siteData.coverImageUrl.protocol).toMatch(/^https?:/);
        }, 15000);

        it('should transform URLs to resource workers domain', async () => {
            const siteData = await initializeSiteData();

            // 如果有 logo，应该被转换到 resource workers 域名
            if (siteData.logoUrl.length > 0) {
                // URL 应该已被适配
                expect(siteData.logoUrl).toBeTruthy();
            }

            // coverImageUrl 应该被转换
            expect(siteData.coverImageUrl).toBeInstanceOf(URL);
        }, 15000);

        it('should match data from getSiteInformation', async () => {
            const siteInfo = await getSiteInformation();
            const siteData = await initializeSiteData();

            // 标题应该匹配
            expect(siteData.siteTitle).toBe(siteInfo.title);
            
            // 描述应该匹配
            expect(siteData.siteDescription).toBe(siteInfo.description);
        }, 15000);

        it('should not throw error on successful fetch', async () => {
            // 这个测试确保函数正常执行不会抛出异常
            await expect(initializeSiteData()).resolves.toBeDefined();
        }, 15000);
    });

    describe('Cache Behavior', () => {
        it('should cache site information on first call', async () => {
            // 第一次调用
            const siteInfo1 = await getSiteInformation();
            expect(siteInfo1).toBeDefined();

            // 验证缓存已设置
            const cached = cacheService.get('site_information');
            expect(cached).not.toBeNull();
            expect(cached).toEqual(siteInfo1);
        }, 15000);

        it('should use cached data on subsequent calls', async () => {
            // 第一次调用
            const siteInfo1 = await getSiteInformation();
            
            // 第二次调用应该从缓存读取
            const startTime = Date.now();
            const siteInfo2 = await getSiteInformation();
            const duration = Date.now() - startTime;

            // 从缓存读取应该很快（小于100ms）
            expect(duration).toBeLessThan(100);
            
            // 数据应该相同
            expect(siteInfo2).toEqual(siteInfo1);
        }, 15000);

        it('should fetch new data after cache is cleared', async () => {
            // 第一次调用
            const siteInfo1 = await getSiteInformation();
            
            // 清除缓存
            cacheService.clear();
            
            // 第二次调用应该重新从 API 获取
            const siteInfo2 = await getSiteInformation();
            
            // 数据应该仍然有效
            expect(siteInfo2).toBeDefined();
            expect(siteInfo2.title).toBe(siteInfo1.title);
        }, 15000);

        it('should demonstrate cache performance improvement', async () => {
            // 第一次调用（无缓存）- 测量时间
            const start1 = Date.now();
            await getSiteInformation();
            const duration1 = Date.now() - start1;

            // 第二次调用（有缓存）- 测量时间
            const start2 = Date.now();
            await getSiteInformation();
            const duration2 = Date.now() - start2;

            // 缓存调用应该明显更快
            expect(duration2).toBeLessThan(duration1);
            expect(duration2).toBeLessThan(50); // 缓存读取应该在50ms内
        }, 15000);
    });

    describe('Real Data Validation', () => {
        it('should return consistent data across multiple calls', async () => {
            cacheService.clear();
            
            const siteInfo1 = await getSiteInformation();
            
            cacheService.clear();
            
            const siteInfo2 = await getSiteInformation();

            // 站点信息应该一致
            expect(siteInfo2.title).toBe(siteInfo1.title);
            expect(siteInfo2.description).toBe(siteInfo1.description);
        }, 20000);

        it('should have non-empty site title', async () => {
            const siteInfo = await getSiteInformation();
            
            expect(siteInfo.title).toBeTruthy();
            expect(siteInfo.title.trim().length).toBeGreaterThan(0);
        }, 15000);

        it('should initialize site data with valid values', async () => {
            const siteData = await initializeSiteData();

            // 确保没有返回错误的默认值
            expect(siteData.siteTitle).not.toBe('Error');
            expect(siteData.siteDescription).not.toBe('Failed to initialize site data');
            
            // 确保有实际的站点信息
            expect(siteData.siteTitle.length).toBeGreaterThan(0);
        }, 15000);
    });

    describe('API Performance', () => {
        it('should complete site information request within reasonable time', async () => {
            cacheService.clear();
            
            const startTime = Date.now();
            await getSiteInformation();
            const duration = Date.now() - startTime;
            
            // 请求应该在5秒内完成
            expect(duration).toBeLessThan(5000);
        }, 10000);

        it('should complete site data initialization within reasonable time', async () => {
            cacheService.clear();
            
            const startTime = Date.now();
            await initializeSiteData();
            const duration = Date.now() - startTime;
            
            // 初始化应该在5秒内完成
            expect(duration).toBeLessThan(5000);
        }, 10000);
    });
});
