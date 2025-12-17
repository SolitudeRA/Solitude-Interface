import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getHighlightPosts, getPosts } from '@api/ghost/posts';
import { GhostAPIClient } from '@api/clients/ghost';
import { cacheService } from '@api/utils/cache';
import type { FeaturedPost, Post, PostTag } from '@api/ghost/types';

// Mock dependencies
vi.mock('@api/clients/ghost');
vi.mock('@api/utils/cache');

describe('Posts API', () => {
    const mockTags: PostTag[] = [
        {
            id: '1',
            slug: 'type-article',
            name: 'Article',
        },
        {
            id: '2',
            slug: 'category-tech',
            name: 'Technology',
        },
    ];

    const mockRawPosts: FeaturedPost[] = [
        {
            id: 'post-1',
            title: 'Test Post 1',
            url: new URL('https://ghost.example.com/post-1'),
            feature_image: new URL('https://ghost.example.com/image1.jpg'),
            published_at: '2024-01-01',
            tags: mockTags,
            post_type: '',
            post_category: '',
            post_series: '',
        },
        {
            id: 'post-2',
            title: 'Test Post 2',
            url: new URL('https://ghost.example.com/post-2'),
            feature_image: new URL('https://ghost.example.com/image2.jpg'),
            published_at: '2024-01-02',
            tags: mockTags,
            post_type: '',
            post_category: '',
            post_series: '',
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock cache service
        vi.mocked(cacheService.get).mockReturnValue(null);
        vi.mocked(cacheService.set).mockImplementation(() => {});
    });

    describe('getHighlightPosts', () => {
        it('should return adapted featured posts', async () => {
            // Mock GhostAPIClient.get
            vi.mocked(GhostAPIClient.prototype.get).mockResolvedValue(
                mockRawPosts,
            );

            const result = await getHighlightPosts();

            expect(result).toHaveLength(2);
            expect(result[0]?.id).toBe('post-1');
            expect(result[0]?.url.toString()).toContain(
                'test-site.example.com',
            );
            expect(result[0]?.feature_image.hostname).toBe('ghost.example.com');
        });

        it('should use default parameters', async () => {
            vi.mocked(GhostAPIClient.prototype.get).mockResolvedValue([]);

            await getHighlightPosts();

            expect(GhostAPIClient.prototype.get).toHaveBeenCalledWith({
                endpoint: '/posts/',
                params: {
                    limit: 12,
                    fields: 'id,title,url,feature_image,primary_tag,published_at',
                    include: 'tags',
                },
            });
        });

        it('should accept custom parameters', async () => {
            vi.mocked(GhostAPIClient.prototype.get).mockResolvedValue([]);

            await getHighlightPosts(5, 'id,title', 'tags,authors');

            expect(GhostAPIClient.prototype.get).toHaveBeenCalledWith({
                endpoint: '/posts/',
                params: {
                    limit: 5,
                    fields: 'id,title',
                    include: 'tags,authors',
                },
            });
        });

        it('should correctly extract and transform tag information', async () => {
            vi.mocked(GhostAPIClient.prototype.get).mockResolvedValue(
                mockRawPosts,
            );

            const result = await getHighlightPosts();

            expect(result[0]?.post_type).toBe('article');
            expect(result[0]?.post_category).toBe('tech');
        });

        it('should read data from cache', async () => {
            const cachedPosts: FeaturedPost[] = [
                {
                    id: 'cached-post',
                    title: 'Cached Post',
                    url: new URL('https://test-site.example.com/cached'),
                    feature_image: new URL('https://example.com/cached.jpg'),
                    published_at: '2024-01-01',
                    post_type: 'article',
                    post_category: 'tech',
                    post_series: 'default',
                },
            ];

            vi.mocked(cacheService.get).mockReturnValue(cachedPosts);

            const result = await getHighlightPosts();

            expect(result).toEqual(cachedPosts);
            expect(GhostAPIClient.prototype.get).not.toHaveBeenCalled();
        });

        it('should cache API response', async () => {
            vi.mocked(GhostAPIClient.prototype.get).mockResolvedValue(
                mockRawPosts,
            );
            vi.mocked(cacheService.get).mockReturnValue(null);

            await getHighlightPosts(10);

            expect(cacheService.set).toHaveBeenCalledWith(
                'featured_posts:10:id,title,url,feature_image,primary_tag,published_at:tags',
                expect.any(Array),
            );
        });

        it('should handle API errors', async () => {
            vi.mocked(GhostAPIClient.prototype.get).mockRejectedValue(
                new Error('API Error'),
            );

            await expect(getHighlightPosts()).rejects.toThrow();
        });

        it('should handle empty results', async () => {
            vi.mocked(GhostAPIClient.prototype.get).mockResolvedValue([]);

            const result = await getHighlightPosts();

            expect(result).toEqual([]);
            expect(cacheService.set).toHaveBeenCalled();
        });
    });

    describe('getPosts', () => {
        const mockFullPosts: Post[] = [
            {
                id: 'post-1',
                title: 'Full Post 1',
                url: new URL('https://ghost.example.com/post-1'),
                feature_image: new URL('https://ghost.example.com/image1.jpg'),
                published_at: '2024-01-01',
                comment_id: 'comment-1',
                excerpt: 'Excerpt 1',
                html: '<p>Content 1</p>',
                tags: mockTags,
                post_type: '',
                post_category: '',
                post_series: '',
            },
        ];

        it('should return all adapted posts', async () => {
            vi.mocked(GhostAPIClient.prototype.get).mockResolvedValue(
                mockFullPosts,
            );

            const result = await getPosts();

            expect(result).toHaveLength(1);
            expect(result[0]?.id).toBe('post-1');
            expect(result[0]?.url.toString()).toContain(
                'test-site.example.com',
            );
        });

        it('should use default include parameter', async () => {
            vi.mocked(GhostAPIClient.prototype.get).mockResolvedValue([]);

            await getPosts();

            expect(GhostAPIClient.prototype.get).toHaveBeenCalledWith({
                endpoint: '/posts/',
                params: {
                    include: 'tags',
                },
            });
        });

        it('should accept custom include parameter', async () => {
            vi.mocked(GhostAPIClient.prototype.get).mockResolvedValue([]);

            await getPosts('tags,authors');

            expect(GhostAPIClient.prototype.get).toHaveBeenCalledWith({
                endpoint: '/posts/',
                params: {
                    include: 'tags,authors',
                },
            });
        });

        it('should read data from cache', async () => {
            const cachedPosts: Post[] = [
                {
                    id: 'cached-post',
                    title: 'Cached Post',
                    url: new URL('https://test-site.example.com/cached'),
                    feature_image: new URL('https://example.com/cached.jpg'),
                    published_at: '2024-01-01',
                    comment_id: 'comment-1',
                    excerpt: 'Excerpt',
                    html: '<p>Content</p>',
                    post_type: 'article',
                    post_category: 'tech',
                    post_series: 'default',
                },
            ];

            vi.mocked(cacheService.get).mockReturnValue(cachedPosts);

            const result = await getPosts();

            expect(result).toEqual(cachedPosts);
            expect(GhostAPIClient.prototype.get).not.toHaveBeenCalled();
        });

        it('should cache API response', async () => {
            vi.mocked(GhostAPIClient.prototype.get).mockResolvedValue(
                mockFullPosts,
            );
            vi.mocked(cacheService.get).mockReturnValue(null);

            await getPosts('tags');

            expect(cacheService.set).toHaveBeenCalledWith(
                'all_posts:tags',
                expect.any(Array),
            );
        });

        it('should preserve all post fields', async () => {
            vi.mocked(GhostAPIClient.prototype.get).mockResolvedValue(
                mockFullPosts,
            );

            const result = await getPosts();

            expect(result[0]?.comment_id).toBe('comment-1');
            expect(result[0]?.excerpt).toBe('Excerpt 1');
            expect(result[0]?.html).toBe('<p>Content 1</p>');
        });

        it('should handle API errors', async () => {
            vi.mocked(GhostAPIClient.prototype.get).mockRejectedValue(
                new Error('API Error'),
            );

            await expect(getPosts()).rejects.toThrow();
        });

        it('should handle empty results', async () => {
            vi.mocked(GhostAPIClient.prototype.get).mockResolvedValue([]);

            const result = await getPosts();

            expect(result).toEqual([]);
            expect(cacheService.set).toHaveBeenCalled();
        });

        it('should use different cache keys for different include parameters', async () => {
            vi.mocked(GhostAPIClient.prototype.get).mockResolvedValue([]);

            await getPosts('tags');
            expect(cacheService.get).toHaveBeenCalledWith('all_posts:tags');

            await getPosts('authors');
            expect(cacheService.get).toHaveBeenCalledWith('all_posts:authors');
        });
    });
});
