import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSiteInformation, initializeSiteData } from '@api/ghost/settings';
import { GhostAPIClient } from '@api/clients/ghost';
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

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(cacheService.get).mockReturnValue(null);
    });

    describe('getSiteInformation', () => {
        it('should return site information', async () => {
            vi.mocked(GhostAPIClient.prototype.get).mockResolvedValue(
                mockSiteInfo,
            );

            const result = await getSiteInformation();

            expect(result.title).toBe('Test Site');
            expect(result.description).toBe('A test site description');
            expect(result.twitter).toBe('@testsite');
        });

        it('should handle API errors', async () => {
            vi.mocked(GhostAPIClient.prototype.get).mockRejectedValue(
                new Error('API Error'),
            );

            await expect(getSiteInformation()).rejects.toThrow();
        });
    });

    describe('initializeSiteData', () => {
        it('should initialize and transform site data', async () => {
            vi.mocked(GhostAPIClient.prototype.get).mockResolvedValue(
                mockSiteInfo,
            );

            const result = await initializeSiteData();

            expect(result.siteTitle).toBe('Test Site');
            expect(result.siteDescription).toBe('A test site description');
            expect(result.logoUrl).toContain('ghost.example.com');
            expect(result.coverImageUrl.hostname).toBe('ghost.example.com');
        });

        it('should convert logo URL to string', async () => {
            vi.mocked(GhostAPIClient.prototype.get).mockResolvedValue(
                mockSiteInfo,
            );

            const result = await initializeSiteData();

            expect(typeof result.logoUrl).toBe('string');
            expect(result.logoUrl).toBeTruthy();
        });

        it('should keep coverImageUrl as URL object', async () => {
            vi.mocked(GhostAPIClient.prototype.get).mockResolvedValue(
                mockSiteInfo,
            );

            const result = await initializeSiteData();

            expect(result.coverImageUrl).toBeInstanceOf(URL);
        });

        it('should return default values on error', async () => {
            vi.mocked(GhostAPIClient.prototype.get).mockRejectedValue(
                new Error('API Error'),
            );

            // Mock console.error to suppress error output in tests
            const consoleErrorSpy = vi
                .spyOn(console, 'error')
                .mockImplementation(() => {});

            const result = await initializeSiteData();

            expect(result.siteTitle).toBe('Error');
            expect(result.siteDescription).toBe('Failed to initialize site data');
            expect(result.logoUrl).toBe('');
            expect(result.coverImageUrl.toString()).toBe(
                'https://example.com/default-cover.jpg',
            );

            consoleErrorSpy.mockRestore();
        });

        it('should log errors to console', async () => {
            const error = new Error('Test Error');
            vi.mocked(GhostAPIClient.prototype.get).mockRejectedValue(error);

            const consoleErrorSpy = vi
                .spyOn(console, 'error')
                .mockImplementation(() => {});

            await initializeSiteData();

            // Should call console.error (may be called multiple times, including in handleApiError)
            expect(consoleErrorSpy).toHaveBeenCalled();
            // Check if contains our expected error log
            const calls = consoleErrorSpy.mock.calls;
            const hasExpectedCall = calls.some(
                call => call[0] === 'Failed to initialize site data:'
            );
            expect(hasExpectedCall).toBe(true);

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

            vi.mocked(GhostAPIClient.prototype.get).mockResolvedValue(
                fullSiteInfo,
            );

            const result = await initializeSiteData();

            expect(result.siteTitle).toBe(fullSiteInfo.title);
            expect(result.siteDescription).toBe(fullSiteInfo.description);
        });
    });
});
