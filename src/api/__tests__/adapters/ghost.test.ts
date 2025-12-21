import { describe, it, expect } from 'vitest';
import { adaptGhostPost } from '@api/adapters/ghost';
import type { Post, FeaturedPost, PostTag } from '@api/ghost/types';

describe('Ghost Adapters', () => {
    describe('adaptGhostPost', () => {
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
            {
                id: '3',
                slug: 'series-web-dev',
                name: 'Web Development Series',
            },
            {
                id: '4',
                slug: 'javascript',
                name: 'JavaScript',
            },
            {
                id: '5',
                slug: 'typescript',
                name: 'TypeScript',
            },
        ];

        it('should correctly convert Post URL to frontend route', () => {
            const mockPost: Post = {
                id: 'test-post-123',
                title: 'Test Post',
                url: new URL('https://ghost.example.com/test-post'),
                feature_image: new URL('https://ghost.example.com/image.jpg'),
                published_at: '2024-01-01',
                comment_id: 'comment-123',
                excerpt: 'Test excerpt',
                html: '<p>Test content</p>',
                tags: mockTags,
                post_type: '',
                post_category: '',
                post_series: '',
            };

            const adapted = adaptGhostPost(mockPost);

            expect(adapted.url.toString()).toBe(
                'https://test-site.example.com/posts/test-post-123',
            );
        });

        it('should preserve feature_image URL', () => {
            const mockPost: FeaturedPost = {
                id: 'test-post',
                title: 'Test',
                url: new URL('https://ghost.example.com/test'),
                feature_image: new URL('https://ghost.example.com/image.jpg'),
                published_at: '2024-01-01',
                tags: [],
                post_type: '',
                post_category: '',
                post_series: '',
            };

            const adapted = adaptGhostPost(mockPost);

            expect(adapted.feature_image.hostname).toBe('ghost.example.com');
            expect(adapted.feature_image.pathname).toBe('/image.jpg');
        });

        it('should correctly extract post_type tag', () => {
            const mockPost: FeaturedPost = {
                id: 'test-post',
                title: 'Test',
                url: new URL('https://ghost.example.com/test'),
                feature_image: new URL('https://ghost.example.com/image.jpg'),
                published_at: '2024-01-01',
                tags: mockTags,
                post_type: '',
                post_category: '',
                post_series: '',
            };

            const adapted = adaptGhostPost(mockPost);

            expect(adapted.post_type).toBe('article');
        });

        it('should correctly extract post_category tag', () => {
            const mockPost: FeaturedPost = {
                id: 'test-post',
                title: 'Test',
                url: new URL('https://ghost.example.com/test'),
                feature_image: new URL('https://ghost.example.com/image.jpg'),
                published_at: '2024-01-01',
                tags: mockTags,
                post_type: '',
                post_category: '',
                post_series: '',
            };

            const adapted = adaptGhostPost(mockPost);

            expect(adapted.post_category).toBe('tech');
        });

        it('should correctly extract post_series tag (using name instead of slug)', () => {
            const mockPost: FeaturedPost = {
                id: 'test-post',
                title: 'Test',
                url: new URL('https://ghost.example.com/test'),
                feature_image: new URL('https://ghost.example.com/image.jpg'),
                published_at: '2024-01-01',
                tags: mockTags,
                post_type: '',
                post_category: '',
                post_series: '',
            };

            const adapted = adaptGhostPost(mockPost);

            expect(adapted.post_series).toBe('Web Development Series');
        });

        it('should filter out tags with special prefixes and keep only general tags', () => {
            const mockPost: FeaturedPost = {
                id: 'test-post',
                title: 'Test',
                url: new URL('https://ghost.example.com/test'),
                feature_image: new URL('https://ghost.example.com/image.jpg'),
                published_at: '2024-01-01',
                tags: mockTags,
                post_type: '',
                post_category: '',
                post_series: '',
            };

            const adapted = adaptGhostPost(mockPost);

            expect(adapted.post_general_tags).toEqual([
                'JavaScript',
                'TypeScript',
            ]);
            expect(adapted.post_general_tags).not.toContain('Article');
            expect(adapted.post_general_tags).not.toContain('Technology');
            expect(adapted.post_general_tags).not.toContain(
                'Web Development Series',
            );
        });

        it('should use default values when tags do not exist', () => {
            const mockPost: FeaturedPost = {
                id: 'test-post',
                title: 'Test',
                url: new URL('https://ghost.example.com/test'),
                feature_image: new URL('https://ghost.example.com/image.jpg'),
                published_at: '2024-01-01',
                tags: [],
                post_type: '',
                post_category: '',
                post_series: '',
            };

            const adapted = adaptGhostPost(mockPost);

            expect(adapted.post_type).toBe('default');
            expect(adapted.post_category).toBe('default');
            expect(adapted.post_series).toBe('default');
        });

        it('should use default values when tags is undefined', () => {
            const mockPost: FeaturedPost = {
                id: 'test-post',
                title: 'Test',
                url: new URL('https://ghost.example.com/test'),
                feature_image: new URL('https://ghost.example.com/image.jpg'),
                published_at: '2024-01-01',
                post_type: '',
                post_category: '',
                post_series: '',
            };

            const adapted = adaptGhostPost(mockPost);

            expect(adapted.post_type).toBe('default');
            expect(adapted.post_category).toBe('default');
            expect(adapted.post_series).toBe('default');
            expect(adapted.post_general_tags).toEqual([]);
        });

        it('should preserve other properties of original post', () => {
            const mockPost: Post = {
                id: 'test-post',
                title: 'Test Post Title',
                url: new URL('https://ghost.example.com/test'),
                feature_image: new URL('https://ghost.example.com/image.jpg'),
                published_at: '2024-01-01T00:00:00.000Z',
                comment_id: 'comment-123',
                excerpt: 'This is a test excerpt',
                html: '<p>Test HTML content</p>',
                tags: mockTags,
                post_type: '',
                post_category: '',
                post_series: '',
            };

            const adapted = adaptGhostPost(mockPost);

            expect(adapted.id).toBe('test-post');
            expect(adapted.title).toBe('Test Post Title');
            expect(adapted.published_at).toBe('2024-01-01T00:00:00.000Z');
            expect(adapted.comment_id).toBe('comment-123');
            expect(adapted.excerpt).toBe('This is a test excerpt');
            expect(adapted.html).toBe('<p>Test HTML content</p>');
        });

        it('should handle cases with only partial special tags', () => {
            const partialTags: PostTag[] = [
                {
                    id: '1',
                    slug: 'type-video',
                    name: 'Video',
                },
                {
                    id: '2',
                    slug: 'react',
                    name: 'React',
                },
            ];

            const mockPost: FeaturedPost = {
                id: 'test-post',
                title: 'Test',
                url: new URL('https://ghost.example.com/test'),
                feature_image: new URL('https://ghost.example.com/image.jpg'),
                published_at: '2024-01-01',
                tags: partialTags,
                post_type: '',
                post_category: '',
                post_series: '',
            };

            const adapted = adaptGhostPost(mockPost);

            expect(adapted.post_type).toBe('video');
            expect(adapted.post_category).toBe('default'); // No category tag
            expect(adapted.post_series).toBe('default'); // No series tag
            expect(adapted.post_general_tags).toEqual(['React']);
        });
    });
});
