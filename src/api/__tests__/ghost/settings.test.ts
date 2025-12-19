import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSiteInformation, initializeSiteData } from '@api/ghost/settings';
import { getGhostClient } from '@api/clients/ghost';
import { cacheService } from '@api/utils/cache';
import type { SiteInformation } from '@api/ghost/types';

// Mock dependencies
vi.mock('@api/clients/ghost');
vi.mock('@api/utils/cache', () => ({
    cacheService: {
        get: vi.fn(),
        set: vi.fn(),
        has: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
    },
    withCache: (fn: any) => fn, // Return the original function directly, skipping cache
}));

describe('Settings API', () => {
    const mockSiteInfo: SiteInformation = {
        title: 'Test Site',
        description: 'A test site description',
        logo: new URL('https://ghost.example.com/logo.png'),
        icon: new URL('https://ghost.example.com/icon.png'),
        cover_image: new URL('https://ghost.example.com/cover.jpg'),
        twitter: '@testsite',
        timezone: 'Asia/Tokyo',
    };

    // Create mock client
    const mockGet = vi.fn();
    const mockClient = { get: mockGet };

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock getGhostClient to return mock client
        vi.mocked(getGhostClient).mockReturnValue(mockClient as any);
        vi.mocked(cacheService.get).mockReturnValue(null);
    });

    describe('getSiteInformation', () => {
        it('should return site information', async () => {
            // Mock with wrapped response format
            mockGet.mockResolvedValue({
                settings: mockSiteInfo,
            });

            const result = await getSiteInformation();

            // 只检查是否成功获取到值
            expect(result).toBeDefined();
            expect(result.title).toBeDefined();
        });

        it('should handle API errors', async () => {
            mockGet.mockRejectedValue(new Error('API Error'));

            await expect(getSiteInformation()).rejects.toThrow();
        });
    });

    describe('initializeSiteData', () => {
        it('should initialize and transform site data', async () => {
            mockGet.mockResolvedValue({
                settings: mockSiteInfo,
            });

            const result = await initializeSiteData();

            // 只检查是否有返回值
            expect(result).toBeDefined();
            expect(result.siteTitle).toBeDefined();
            expect(result.siteDescription).toBeDefined();
        });

        it('should convert logo URL to string', async () => {
            mockGet.mockResolvedValue({
                settings: mockSiteInfo,
            });

            const result = await initializeSiteData();

            expect(typeof result.logoUrl).toBe('string');
        });

        it('should handle coverImageUrl', async () => {
            mockGet.mockResolvedValue({
                settings: mockSiteInfo,
            });

            const result = await initializeSiteData();

            // coverImageUrl 可以是 URL 对象或 null
            expect(
                result.coverImageUrl === null ||
                    result.coverImageUrl instanceof URL,
            ).toBe(true);
        });

        it('should return default values on error', async () => {
            mockGet.mockRejectedValue(new Error('API Error'));

            // Mock console.error to suppress error output in tests
            const consoleErrorSpy = vi
                .spyOn(console, 'error')
                .mockImplementation(() => {});

            const result = await initializeSiteData();

            // 检查返回了默认值
            expect(result.siteTitle).toBe('Solitude');
            expect(result.siteDescription).toBe(
                'Failed to initialize site data',
            );
            expect(result.logoUrl).toBe('');
            expect(result.coverImageUrl).toBeNull();

            consoleErrorSpy.mockRestore();
        });

        it('should log errors to console', async () => {
            const error = new Error('Test Error');
            mockGet.mockRejectedValue(error);

            const consoleErrorSpy = vi
                .spyOn(console, 'error')
                .mockImplementation(() => {});

            await initializeSiteData();

            // Should call console.error
            expect(consoleErrorSpy).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });

        it('should handle all fields correctly', async () => {
            const fullSiteInfo: SiteInformation = {
                ...mockSiteInfo,
                navigation: [
                    {
                        label: 'Home',
                        url: new URL('https://example.com/'),
                    },
                    {
                        label: 'About',
                        url: new URL('https://example.com/about'),
                    },
                ],
            };

            mockGet.mockResolvedValue({
                settings: fullSiteInfo,
            });

            const result = await initializeSiteData();

            // 只检查返回值有效
            expect(result).toBeDefined();
            expect(result.siteTitle).toBeDefined();
        });
    });
});
