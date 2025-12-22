import { describe, it, expect, beforeEach } from 'vitest';
import { getHighlightPosts, getPosts } from '@api/ghost/posts';
import { cacheService } from '@api/utils/cache';

describe('Posts API Integration Tests', () => {
    beforeEach(() => {
        // 确保每个测试开始时缓存是清空的
        cacheService.clear();
    });

    describe('getHighlightPosts', () => {
        it('should fetch real highlighted posts from Ghost API', async () => {
            const posts = await getHighlightPosts();

            expect(Array.isArray(posts)).toBe(true);
            expect(posts.length).toBeGreaterThan(0);
            expect(posts.length).toBeLessThanOrEqual(12); // 默认限制是 12

            // 验证文章结构
            const firstPost = posts[0];
            expect(firstPost).toHaveProperty('id');
            expect(firstPost).toHaveProperty('title');
            expect(firstPost).toHaveProperty('url');
            expect(firstPost).toHaveProperty('feature_image');
            expect(firstPost).toHaveProperty('published_at');
            expect(firstPost).toHaveProperty('post_type');
            expect(firstPost).toHaveProperty('post_category');
            expect(firstPost).toHaveProperty('post_series');
        }, 15000);

        it('should respect custom limit parameter', async () => {
            const limit = 3;
            const posts = await getHighlightPosts(limit);

            expect(posts.length).toBeLessThanOrEqual(limit);
        }, 15000);

        it('should return adapted URLs pointing to site domain', async () => {
            const posts = await getHighlightPosts(1);

            expect(posts.length).toBeGreaterThan(0);
            const post = posts[0]!;

            // URL 应该被转换为站点域名
            expect(post.url).toBeInstanceOf(URL);
            expect(post.url.toString()).toContain('/posts/');

            // feature_image 应该被转换为 resource workers 域名
            expect(post.feature_image).toBeInstanceOf(URL);
        }, 15000);

        it('should extract and transform tags correctly', async () => {
            const posts = await getHighlightPosts(5);

            // 查找有标签的文章
            const postWithTags = posts.find(
                (post) => post.tags && post.tags.length > 0,
            );

            if (postWithTags) {
                // 验证 post_type 提取（type- 前缀）
                expect(typeof postWithTags.post_type).toBe('string');

                // 验证 post_category 提取（category- 前缀）
                expect(typeof postWithTags.post_category).toBe('string');

                // 验证 post_series 提取（series- 前缀）
                expect(typeof postWithTags.post_series).toBe('string');

                // 验证一般标签过滤（应该过滤掉特殊前缀的标签）
                if (postWithTags.post_general_tags) {
                    expect(Array.isArray(postWithTags.post_general_tags)).toBe(
                        true,
                    );
                    // 确保一般标签中没有特殊前缀
                    postWithTags.post_general_tags.forEach((tag) => {
                        expect(tag).not.toMatch(/^type-/);
                        expect(tag).not.toMatch(/^category-/);
                        expect(tag).not.toMatch(/^series-/);
                    });
                }
            }
        }, 15000);

        it('should cache results on first call', async () => {
            // 第一次调用 - 应该调用 API
            const posts1 = await getHighlightPosts(5);
            expect(posts1.length).toBeGreaterThan(0);

            // 验证缓存已设置
            const cacheKey =
                'featured_posts:5:id,title,url,feature_image,primary_tag,published_at:tags';
            const cached = cacheService.get(cacheKey);
            expect(cached).not.toBeNull();
            expect(cached).toEqual(posts1);
        }, 15000);

        it('should use cached data on subsequent calls', async () => {
            // 第一次调用
            const firstCallPosts = await getHighlightPosts(5);

            // 第二次调用应该从缓存读取
            const startTime = Date.now();
            const secondCallPosts = await getHighlightPosts(5);
            const duration = Date.now() - startTime;

            // 从缓存读取应该很快（小于100ms）
            expect(duration).toBeLessThan(100);

            // 数据应该相同
            expect(secondCallPosts).toEqual(firstCallPosts);
        }, 15000);

        it('should fetch new data after cache is cleared', async () => {
            // 第一次调用
            const initialPosts = await getHighlightPosts(5);
            expect(initialPosts.length).toBeGreaterThan(0);

            // 清除缓存
            cacheService.clear();

            // 第二次调用应该重新从 API 获取
            const newPosts = await getHighlightPosts(5);

            // 数据结构应该相同，但可能是新获取的
            expect(newPosts.length).toBeGreaterThan(0);
            expect(newPosts[0]).toHaveProperty('id');
        }, 15000);
    });

    describe('getPosts', () => {
        it('should fetch all posts with complete data', async () => {
            const posts = await getPosts();

            expect(Array.isArray(posts)).toBe(true);
            expect(posts.length).toBeGreaterThan(0);

            // 验证完整文章结构
            const firstPost = posts[0];
            expect(firstPost).toHaveProperty('id');
            expect(firstPost).toHaveProperty('title');
            expect(firstPost).toHaveProperty('url');
            expect(firstPost).toHaveProperty('feature_image');
            expect(firstPost).toHaveProperty('published_at');
            expect(firstPost).toHaveProperty('comment_id');
            expect(firstPost).toHaveProperty('excerpt');
            expect(firstPost).toHaveProperty('html');
        }, 15000);

        it('should include tags when specified', async () => {
            const posts = await getPosts('tags');

            expect(posts.length).toBeGreaterThan(0);
            const firstPost = posts[0]!;
            // 如果文章有标签，应该被包含
            if (firstPost.tags) {
                expect(Array.isArray(firstPost.tags)).toBe(true);
            }
        }, 15000);

        it('should adapt all post URLs correctly', async () => {
            const posts = await getPosts();

            posts.forEach((post) => {
                // 每个文章的 URL 都应该被转换
                expect(post.url).toBeInstanceOf(URL);
                expect(post.url.toString()).toContain('/posts/');

                // feature_image 应该被转换
                expect(post.feature_image).toBeInstanceOf(URL);
            });
        }, 15000);

        it('should cache results with correct key', async () => {
            const include = 'tags,authors';
            const posts = await getPosts(include);

            // 验证缓存
            const cacheKey = `all_posts:${include}`;
            const cached = cacheService.get(cacheKey);
            expect(cached).not.toBeNull();
            expect(cached).toEqual(posts);
        }, 15000);

        it('should use different cache keys for different include parameters', async () => {
            // 使用不同的 include 参数
            const posts1 = await getPosts('tags');
            const posts2 = await getPosts('authors');

            // 验证两个不同的缓存键
            const cached1 = cacheService.get('all_posts:tags');
            const cached2 = cacheService.get('all_posts:authors');

            expect(cached1).not.toBeNull();
            expect(cached2).not.toBeNull();
            expect(cached1).toEqual(posts1);
            expect(cached2).toEqual(posts2);
        }, 15000);

        it('should preserve HTML content from Ghost', async () => {
            const posts = await getPosts();

            // 查找有 HTML 内容的文章
            const postWithHtml = posts.find(
                (post) => post.html && post.html.length > 0,
            );

            if (postWithHtml) {
                expect(typeof postWithHtml.html).toBe('string');
                expect(postWithHtml.html.length).toBeGreaterThan(0);
                // HTML 应该包含标签
                expect(postWithHtml.html).toMatch(/<[^>]+>/);
            }
        }, 15000);

        it('should have valid excerpt for posts', async () => {
            const posts = await getPosts();

            // 查找有摘要的文章
            const postWithExcerpt = posts.find(
                (post) => post.excerpt && post.excerpt.length > 0,
            );

            if (postWithExcerpt) {
                expect(typeof postWithExcerpt.excerpt).toBe('string');
                expect(postWithExcerpt.excerpt.length).toBeGreaterThan(0);
            }
        }, 15000);
    });

    describe('Cache Performance', () => {
        it('should demonstrate significant speed improvement with cache', async () => {
            // 第一次调用（无缓存）- 测量时间
            const start1 = Date.now();
            await getHighlightPosts(3);
            const duration1 = Date.now() - start1;

            // 第二次调用（有缓存）- 测量时间
            const start2 = Date.now();
            await getHighlightPosts(3);
            const duration2 = Date.now() - start2;

            // 缓存调用应该明显更快
            expect(duration2).toBeLessThan(duration1);
            expect(duration2).toBeLessThan(50); // 缓存读取应该在50ms内
        }, 15000);
    });

    describe('Real Data Validation', () => {
        it('should return published posts only', async () => {
            const posts = await getPosts();

            posts.forEach((post) => {
                // 所有文章都应该有发布日期
                expect(post.published_at).toBeDefined();
                expect(typeof post.published_at).toBe('string');

                // 发布日期应该是有效的日期字符串
                const publishedDate = new Date(post.published_at);
                expect(publishedDate.toString()).not.toBe('Invalid Date');
            });
        }, 15000);

        it('should have valid post IDs', async () => {
            const posts = await getPosts();

            posts.forEach((post) => {
                expect(post.id).toBeDefined();
                expect(typeof post.id).toBe('string');
                expect(post.id.length).toBeGreaterThan(0);
            });
        }, 15000);
    });
});
