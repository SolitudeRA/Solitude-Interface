import { getGhostClient } from '@api/clients/ghost';
import { adaptGhostPost } from '@api/adapters/ghost';
import type { FeaturedPost, Post } from '@api/ghost/types';
import { handleApiError } from '@api/utils/errorHandlers';
import { cacheService } from '@api/utils/cache';
import {
    type Locale,
    LOCALES,
    DEFAULT_LOCALE,
    localeToLangTag,
    i18nKeyToTag,
    extractI18nKey,
    extractLocaleFromTags,
} from '@lib/i18n';

export async function getHighlightPosts(
    limit: number = 12,
    fields: string = 'id,title,url,feature_image,primary_tag,published_at',
    include: string = 'tags',
): Promise<FeaturedPost[]> {
    const cacheKey = `featured_posts:${limit}:${fields}:${include}`;
    const cachedPosts = cacheService.get<FeaturedPost[]>(cacheKey);
    if (cachedPosts) {
        return cachedPosts;
    }

    try {
        const response = await getGhostClient().get<{ posts: FeaturedPost[] }>({
            endpoint: '/posts/',
            params: { limit, fields, include },
        });

        const posts = response.posts || [];
        const adaptedPosts = posts.map((post) => adaptGhostPost(post));

        cacheService.set(cacheKey, adaptedPosts);

        return adaptedPosts;
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * 按语言获取文章列表
 * @param locale - 语言代码
 * @param options - 分页选项
 */
export async function listPostsByLocale(
    locale: Locale,
    options: { page?: number; limit?: number } = {},
): Promise<Post[]> {
    const { page = 1, limit = 15 } = options;
    const langTag = localeToLangTag(locale);
    const cacheKey = `posts_by_locale:${locale}:${page}:${limit}`;

    const cachedPosts = cacheService.get<Post[]>(cacheKey);
    if (cachedPosts) {
        return cachedPosts;
    }

    try {
        const response = await getGhostClient().get<{ posts: Post[] }>({
            endpoint: '/posts/',
            params: {
                include: 'tags',
                filter: `tag:${langTag}`,
                page,
                limit,
            },
        });

        const posts = response.posts || [];
        const adaptedPosts = posts.map((post) => adaptGhostPost(post));

        cacheService.set(cacheKey, adaptedPosts);

        return adaptedPosts;
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * 获取指定翻译组和语言的文章
 * @param key - 翻译组 key (不含 hash-i18n- 前缀)
 * @param locale - 语言代码
 */
export async function getPostByGroupAndLocale(
    key: string,
    locale: Locale,
): Promise<Post | null> {
    const langTag = localeToLangTag(locale);
    const i18nTag = i18nKeyToTag(key);
    const cacheKey = `post_by_group:${key}:${locale}`;

    const cachedPost = cacheService.get<Post | null>(cacheKey);
    if (cachedPost !== undefined) {
        return cachedPost;
    }

    try {
        const response = await getGhostClient().get<{ posts: Post[] }>({
            endpoint: '/posts/',
            params: {
                include: 'tags',
                filter: `tag:${i18nTag}+tag:${langTag}`,
                limit: 1,
            },
        });

        const posts = response.posts || [];
        const firstPost = posts[0];
        if (!firstPost) {
            cacheService.set(cacheKey, null);
            return null;
        }

        const adaptedPost = adaptGhostPost<Post>(firstPost);
        cacheService.set(cacheKey, adaptedPost);

        return adaptedPost;
    } catch (error) {
        // 如果是 404 或文章不存在，返回 null 而不是抛出错误
        console.error(
            `Failed to get post for key=${key}, locale=${locale}:`,
            error,
        );
        return null;
    }
}

/**
 * 获取指定翻译组的所有语言版本
 * @param key - 翻译组 key
 * @returns 包含每个语言版本是否存在的记录
 */
export async function getVariantsByGroup(
    key: string,
): Promise<Record<Locale, Post | null>> {
    const i18nTag = i18nKeyToTag(key);
    const cacheKey = `variants_by_group:${key}`;

    const cachedVariants =
        cacheService.get<Record<Locale, Post | null>>(cacheKey);
    if (cachedVariants) {
        return cachedVariants;
    }

    // 构建 filter: tag:hash-i18n-xxx+tag:[hash-lang-zh,hash-lang-ja,hash-lang-en]
    const langTags = LOCALES.map((l) => localeToLangTag(l)).join(',');
    const filter = `tag:${i18nTag}+tag:[${langTags}]`;

    try {
        const response = await getGhostClient().get<{ posts: Post[] }>({
            endpoint: '/posts/',
            params: {
                include: 'tags',
                filter,
                limit: LOCALES.length,
            },
        });

        const posts = response.posts || [];
        const variants: Record<Locale, Post | null> = {
            zh: null,
            ja: null,
            en: null,
        };

        for (const post of posts) {
            const locale = extractLocaleFromTags(post.tags);
            if (locale) {
                variants[locale] = adaptGhostPost<Post>(post);
            }
        }

        cacheService.set(cacheKey, variants);

        return variants;
    } catch (error) {
        console.error(`Failed to get variants for key=${key}:`, error);
        return { zh: null, ja: null, en: null };
    }
}

/**
 * 获取所有翻译组 key（处理分页，获取全部）
 * @returns 所有翻译组 key 的数组
 */
export async function listAllGroupKeys(): Promise<string[]> {
    const cacheKey = 'all_group_keys';

    const cachedKeys = cacheService.get<string[]>(cacheKey);
    if (cachedKeys) {
        return cachedKeys;
    }

    const allKeys = new Set<string>();
    let page = 1;
    const limit = 100; // Ghost API 最大单页数量

    try {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        while (true) {
            const response = await getGhostClient().get<{
                posts: Post[];
                meta: { pagination: { pages: number } };
            }>({
                endpoint: '/posts/',
                params: {
                    include: 'tags',
                    fields: 'id',
                    page,
                    limit,
                },
            });

            const posts = response.posts || [];

            for (const post of posts) {
                const key = extractI18nKey(post.tags);
                if (key) {
                    allKeys.add(key);
                }
            }

            // 检查是否还有更多页
            const totalPages = response.meta?.pagination?.pages ?? 1;
            if (page >= totalPages) {
                break;
            }
            page++;
        }

        const keysArray = Array.from(allKeys);
        cacheService.set(cacheKey, keysArray);

        return keysArray;
    } catch (error) {
        console.error('Failed to list all group keys:', error);
        return [];
    }
}

/**
 * 获取文章并带有 fallback 逻辑
 * @param key - 翻译组 key
 * @param requestedLocale - 请求的语言
 * @returns 文章和实际显示的语言
 */
export async function getPostWithFallback(
    key: string,
    requestedLocale: Locale,
): Promise<{
    post: Post | null;
    displayedLocale: Locale;
    isFallback: boolean;
}> {
    // 首先尝试获取请求的语言版本
    const requestedPost = await getPostByGroupAndLocale(key, requestedLocale);

    if (requestedPost) {
        return {
            post: requestedPost,
            displayedLocale: requestedLocale,
            isFallback: false,
        };
    }

    // 如果请求的语言不存在，尝试 fallback 到默认语言
    if (requestedLocale !== DEFAULT_LOCALE) {
        const fallbackPost = await getPostByGroupAndLocale(key, DEFAULT_LOCALE);
        if (fallbackPost) {
            return {
                post: fallbackPost,
                displayedLocale: DEFAULT_LOCALE,
                isFallback: true,
            };
        }
    }

    // 如果默认语言也不存在，尝试任意存在的语言
    const variants = await getVariantsByGroup(key);
    for (const locale of LOCALES) {
        if (variants[locale]) {
            return {
                post: variants[locale],
                displayedLocale: locale,
                isFallback: locale !== requestedLocale,
            };
        }
    }

    return {
        post: null,
        displayedLocale: requestedLocale,
        isFallback: false,
    };
}

export async function getPosts(include: string = 'tags'): Promise<Post[]> {
    // 生成缓存键
    const cacheKey = `all_posts:${include}`;

    // 尝试从缓存获取
    const cachedPosts = cacheService.get<Post[]>(cacheKey);
    if (cachedPosts) {
        return cachedPosts;
    }

    try {
        const response = await getGhostClient().get<{ posts: Post[] }>({
            endpoint: '/posts/',
            params: { include },
        });

        const posts = response.posts || [];
        const adaptedPosts = posts.map((post) => adaptGhostPost(post));

        cacheService.set(cacheKey, adaptedPosts);

        return adaptedPosts;
    } catch (error) {
        return handleApiError(error);
    }
}
