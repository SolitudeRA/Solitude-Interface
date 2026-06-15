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
            {
                id: '6',
                slug: 'hash-lang-en',
                name: '#lang-en',
            },
            {
                id: '7',
                slug: 'hash-i18n-test-post',
                name: '#i18n-test-post',
            },
        ];

        it('should correctly convert Post URL to localized frontend route', () => {
            const mockPost: Post = {
                id: 'test-post-123',
                slug: 'ja-slug-key',
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

            expect(adapted.url.toString()).toBe('https://test-site.example.com/en/p/slug-key');
        });

        it('should fallback to legacy i18n tag route when post slug has no locale prefix', () => {
            const mockPost: Post = {
                id: 'test-post-123',
                slug: 'ghost-generated-slug',
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

            expect(adapted.url.toString()).toBe('https://test-site.example.com/en/p/test-post');
        });

        it('should use legacy post URL when i18n tag does not exist', () => {
            const mockPost: Post = {
                id: 'test-post-123',
                title: 'Test Post',
                url: new URL('https://ghost.example.com/test-post'),
                feature_image: new URL('https://ghost.example.com/image.jpg'),
                published_at: '2024-01-01',
                comment_id: 'comment-123',
                excerpt: 'Test excerpt',
                html: '<p>Test content</p>',
                tags: mockTags.filter((tag) => !tag.slug.startsWith('hash-')),
                post_type: '',
                post_category: '',
                post_series: '',
            };

            const adapted = adaptGhostPost(mockPost);

            expect(adapted.url.toString()).toBe(
                'https://test-site.example.com/posts/test-post-123'
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

            expect(adapted.feature_image?.hostname).toBe('ghost.example.com');
            expect(adapted.feature_image?.pathname).toBe('/image.jpg');
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

        it('should localize tag labels from a registry while keeping raw tag identity fields', () => {
            const mockPost: FeaturedPost = {
                id: 'test-post',
                slug: 'zh-registry-test',
                title: 'Test',
                url: new URL('https://ghost.example.com/test'),
                feature_image: new URL('https://ghost.example.com/image.jpg'),
                published_at: '2024-01-01',
                tags: [
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
                        slug: 'series-homeserver',
                        name: 'Homeserver Series',
                    },
                    {
                        id: '4',
                        slug: 'topic-nextcloud',
                        name: 'Nextcloud',
                    },
                    {
                        id: '5',
                        slug: 'hash-lang-zh',
                        name: '#lang-zh',
                    },
                ],
                post_type: '',
                post_category: '',
                post_series: '',
            };

            const adapted = adaptGhostPost(mockPost, {
                tagRegistry: {
                    'type-article': {
                        kind: 'type',
                        label: { zh: '文章', ja: '記事', en: 'Article' },
                    },
                    'category-tech': {
                        kind: 'category',
                        label: { zh: '技术', ja: '技術', en: 'Tech' },
                    },
                    'series-homeserver': {
                        kind: 'series',
                        label: {
                            zh: '家用服务器完整构建指南',
                            ja: 'ホームサーバー完全構築ガイド',
                            en: 'Homeserver Complete Build Guide',
                        },
                    },
                    'topic-nextcloud': {
                        kind: 'topic',
                        label: { zh: 'Nextcloud', ja: 'Nextcloud', en: 'Nextcloud' },
                    },
                },
            });

            expect(adapted.post_type).toBe('article');
            expect(adapted.post_type_label).toBe('文章');
            expect(adapted.post_category).toBe('tech');
            expect(adapted.post_category_label).toBe('技术');
            expect(adapted.post_series_slug).toBe('series-homeserver');
            expect(adapted.post_series).toBe('家用服务器完整构建指南');
            expect(adapted.post_general_tags).toEqual(['Nextcloud']);
            expect(adapted.post_general_tag_slugs).toEqual(['topic-nextcloud']);
            expect(adapted.tags?.find((tag) => tag.slug === 'type-article')?.name).toBe('文章');
        });

        it('should extract the series number from the post slug when using an unnumbered series tag', () => {
            const mockPost: FeaturedPost = {
                id: 'test-post',
                slug: 'ja-homeserver-8',
                title: 'Smart Home Platform',
                url: new URL('https://ghost.example.com/test'),
                feature_image: new URL('https://ghost.example.com/image.jpg'),
                published_at: '2024-01-01',
                tags: [
                    ...mockTags.filter((tag) => !tag.slug.startsWith('series-')),
                    {
                        id: '8',
                        slug: 'series-homeserver',
                        name: 'Homeserver Series',
                    },
                ],
                post_type: '',
                post_category: '',
                post_series: '',
            };

            const adapted = adaptGhostPost(mockPost);

            expect(adapted.post_series_number).toBe('#8');
        });

        it('should fallback to a legacy numbered series tag slug', () => {
            const mockPost: FeaturedPost = {
                id: 'test-post',
                title: 'Smart Home Platform',
                url: new URL('https://ghost.example.com/test'),
                feature_image: new URL('https://ghost.example.com/image.jpg'),
                published_at: '2024-01-01',
                tags: [
                    ...mockTags.filter((tag) => !tag.slug.startsWith('series-')),
                    {
                        id: '8',
                        slug: 'series-homeserver-8',
                        name: 'Homeserver Series',
                    },
                ],
                post_type: '',
                post_category: '',
                post_series: '',
            };

            const adapted = adaptGhostPost(mockPost);

            expect(adapted.post_series_number).toBe('#8');
        });

        it('should not extract a series number from an unnumbered series tag slug', () => {
            const mockPost: FeaturedPost = {
                id: 'test-post',
                title: '#8 Smart Home Platform',
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
            expect(adapted.post_series_number).toBe('');
        });

        it('should not extract a series number when the post has no series tag', () => {
            const mockPost: FeaturedPost = {
                id: 'test-post',
                title: '#8 Not A Series Post',
                url: new URL('https://ghost.example.com/test'),
                feature_image: new URL('https://ghost.example.com/image.jpg'),
                published_at: '2024-01-01',
                tags: mockTags.filter((tag) => !tag.slug.startsWith('series-')),
                post_type: '',
                post_category: '',
                post_series: '',
            };

            const adapted = adaptGhostPost(mockPost);

            expect(adapted.post_series_number).toBe('');
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

            expect(adapted.post_general_tags).toEqual(['JavaScript', 'TypeScript']);
            expect(adapted.post_general_tags).not.toContain('Article');
            expect(adapted.post_general_tags).not.toContain('Technology');
            expect(adapted.post_general_tags).not.toContain('Web Development Series');
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
            expect(adapted.post_series_number).toBe('');
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

        it('should filter out internal tags (hash- prefix)', () => {
            const tagsWithInternal: PostTag[] = [
                {
                    id: '1',
                    slug: 'type-article',
                    name: 'Article',
                },
                {
                    id: '2',
                    slug: 'javascript',
                    name: 'JavaScript',
                },
                {
                    id: '3',
                    slug: 'hash-lang-zh',
                    name: '#lang-zh',
                },
                {
                    id: '4',
                    slug: 'hash-i18n-test-post',
                    name: '#i18n-test-post',
                },
            ];

            const mockPost: FeaturedPost = {
                id: 'test-post',
                title: 'Test',
                url: new URL('https://ghost.example.com/test'),
                feature_image: new URL('https://ghost.example.com/image.jpg'),
                published_at: '2024-01-01',
                tags: tagsWithInternal,
                post_type: '',
                post_category: '',
                post_series: '',
            };

            const adapted = adaptGhostPost(mockPost);

            expect(adapted.post_general_tags).toEqual(['JavaScript']);
            expect(adapted.post_general_tags).not.toContain('#lang-zh');
            expect(adapted.post_general_tags).not.toContain('#i18n-test-post');
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
