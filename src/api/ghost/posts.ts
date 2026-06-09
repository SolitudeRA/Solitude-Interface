import { getGhostClient } from '@api/clients/ghost';
import { adaptGhostPost } from '@api/adapters/ghost';
import type { FeaturedPost, Post } from '@api/ghost/types';
import { handleApiError } from '@api/utils/errorHandlers';
import { getCache, setCache } from '@api/utils/cache';
import { getTagRegistry } from '@api/ghost/tagRegistry';
import {
    type Locale,
    LOCALES,
    DEFAULT_LOCALE,
    localeToLangTag,
    extractI18nKeyFromPost,
    extractLocaleFromPost,
} from '@lib/i18n';

const MAX_GHOST_PAGE_SIZE = 100;
const POST_INDEX_BY_GROUP_CACHE_KEY = 'post_index_by_group';

interface GhostPostsResponse {
    posts: Post[];
    meta?: {
        pagination?: {
            pages?: number;
        };
    };
}

type PostIndexByGroup = Map<string, Partial<Record<Locale, Post>>>;

function createEmptyVariants(): Record<Locale, Post | null> {
    return {
        zh: null,
        ja: null,
        en: null,
    };
}

async function adaptPosts<T extends Post | FeaturedPost>(posts: T[] | undefined): Promise<T[]> {
    const tagRegistry = await getTagRegistry();

    return (posts || []).map((post) => adaptGhostPost(post, { tagRegistry }));
}

async function fetchPostsPage(page: number, limit: number): Promise<GhostPostsResponse> {
    return getGhostClient().get<GhostPostsResponse>({
        endpoint: '/posts/',
        params: {
            include: 'tags',
            page,
            limit,
        },
    });
}

async function getPostIndexByGroup(): Promise<PostIndexByGroup> {
    const cachedIndex = getCache<PostIndexByGroup>(POST_INDEX_BY_GROUP_CACHE_KEY);
    if (cachedIndex !== undefined) {
        return cachedIndex;
    }

    const posts = await listAllPosts({ limit: MAX_GHOST_PAGE_SIZE });
    const index: PostIndexByGroup = new Map();

    for (const post of posts) {
        const key = extractI18nKeyFromPost(post);
        const locale = extractLocaleFromPost(post);

        if (!key || !locale) {
            continue;
        }

        const variants = index.get(key) ?? {};
        variants[locale] = post;
        index.set(key, variants);
    }

    setCache(POST_INDEX_BY_GROUP_CACHE_KEY, index);
    return index;
}

export async function getHighlightPosts(
    limit: number = 12,
    fields: string = 'id,slug,title,url,feature_image,primary_tag,published_at',
    include: string = 'tags'
): Promise<FeaturedPost[]> {
    const cacheKey = `featured_posts:${limit}:${fields}:${include}`;
    const cachedPosts = getCache<FeaturedPost[]>(cacheKey);
    if (cachedPosts !== undefined) {
        return cachedPosts;
    }

    try {
        const response = await getGhostClient().get<{ posts: FeaturedPost[] }>({
            endpoint: '/posts/',
            params: { limit, fields, include },
        });

        const adaptedPosts = await adaptPosts(response.posts);

        setCache(cacheKey, adaptedPosts);

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
    options: { page?: number; limit?: number } = {}
): Promise<Post[]> {
    const { page = 1, limit = 15 } = options;
    const langTag = localeToLangTag(locale);
    const cacheKey = `posts_by_locale:${locale}:${page}:${limit}`;

    const cachedPosts = getCache<Post[]>(cacheKey);
    if (cachedPosts !== undefined) {
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
        const adaptedPosts = await adaptPosts(posts);

        setCache(cacheKey, adaptedPosts);

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
export async function getPostByGroupAndLocale(key: string, locale: Locale): Promise<Post | null> {
    const cacheKey = `post_by_group:${key}:${locale}`;

    const cachedPost = getCache<Post | null>(cacheKey);
    if (cachedPost !== undefined) {
        return cachedPost;
    }

    try {
        const index = await getPostIndexByGroup();
        const post = index.get(key)?.[locale] ?? null;

        setCache(cacheKey, post);
        return post;
    } catch (error) {
        console.error(`Failed to get post for key=${key}, locale=${locale}:`, error);
        return null;
    }
}

/**
 * 获取指定翻译组的所有语言版本
 * @param key - 翻译组 key
 * @returns 包含每个语言版本是否存在的记录
 */
export async function getVariantsByGroup(key: string): Promise<Record<Locale, Post | null>> {
    const cacheKey = `variants_by_group:${key}`;

    const cachedVariants = getCache<Record<Locale, Post | null>>(cacheKey);
    if (cachedVariants !== undefined) {
        return cachedVariants;
    }

    try {
        const index = await getPostIndexByGroup();
        const indexedVariants = index.get(key);
        const variants = createEmptyVariants();

        for (const locale of LOCALES) {
            variants[locale] = indexedVariants?.[locale] ?? null;
        }

        setCache(cacheKey, variants);

        return variants;
    } catch (error) {
        console.error(`Failed to get variants for key=${key}:`, error);
        return createEmptyVariants();
    }
}

/**
 * 获取所有翻译组 key（处理分页，获取全部）
 * @returns 所有翻译组 key 的数组
 */
export async function listAllGroupKeys(): Promise<string[]> {
    const cacheKey = 'all_group_keys';

    const cachedKeys = getCache<string[]>(cacheKey);
    if (cachedKeys !== undefined) {
        return cachedKeys;
    }

    try {
        const postIndex = await getPostIndexByGroup();
        const keysArray = Array.from(postIndex.keys());
        setCache(cacheKey, keysArray);

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
    requestedLocale: Locale
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
    const cachedPosts = getCache<Post[]>(cacheKey);
    if (cachedPosts !== undefined) {
        return cachedPosts;
    }

    try {
        const response = await getGhostClient().get<{ posts: Post[] }>({
            endpoint: '/posts/',
            params: { include },
        });

        const adaptedPosts = await adaptPosts(response.posts);

        setCache(cacheKey, adaptedPosts);

        return adaptedPosts;
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * 获取文章用于视图展示。
 * 未指定 page 时会分页拉取全部文章；指定 page 时只拉取该页。
 * @param options - 分页选项
 */
export async function listAllPosts(
    options: { page?: number; limit?: number } = {}
): Promise<Post[]> {
    const { page, limit = MAX_GHOST_PAGE_SIZE } = options;
    const cacheKey = page ? `all_posts_view:${page}:${limit}` : `all_posts_view:all:${limit}`;

    const cachedPosts = getCache<Post[]>(cacheKey);
    if (cachedPosts !== undefined) {
        return cachedPosts;
    }

    try {
        if (page !== undefined) {
            const response = await fetchPostsPage(page, limit);
            const pagePosts = await adaptPosts(response.posts);

            setCache(cacheKey, pagePosts);
            return pagePosts;
        }

        const allPosts: Post[] = [];
        let currentPage = 1;
        let totalPages = 1;

        do {
            const response = await fetchPostsPage(currentPage, limit);
            allPosts.push(...(await adaptPosts(response.posts)));

            totalPages = response.meta?.pagination?.pages ?? 1;
            currentPage++;
        } while (currentPage <= totalPages);

        setCache(cacheKey, allPosts);

        return allPosts;
    } catch (error) {
        return handleApiError(error);
    }
}
