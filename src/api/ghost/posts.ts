import { getGhostClient } from '@api/clients/ghost';
import { adaptGhostPost, isAdaptablePost } from '@api/adapters/ghost';
import type { FeaturedPost, Post } from '@api/ghost/types';
import { handleApiError } from '@api/utils/errorHandlers';
import { getCache, setCache } from '@api/utils/cache';
import { CACHE_KEYS } from '@api/utils/cacheKeys';
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
const POST_INDEX_BY_GROUP_CACHE_KEY = CACHE_KEYS.postIndexByGroup();

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

    // 边界收敛:丢弃缺少必要字段的畸形条目(并告警),避免单条坏数据拖垮整批适配
    const usable = (posts || []).filter((post) => {
        if (isAdaptablePost(post)) return true;
        console.warn('[posts] 跳过畸形 Ghost post(缺少 id/title):', (post as { id?: unknown })?.id);
        return false;
    });

    return usable.map((post) => adaptGhostPost(post, { tagRegistry }));
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
    const cacheKey = CACHE_KEYS.featuredPosts(limit, fields, include);
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
    const cacheKey = CACHE_KEYS.postsByLocale(locale, page, limit);

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
    const cacheKey = CACHE_KEYS.postByGroup(key, locale);

    const cachedPost = getCache<Post | null>(cacheKey);
    if (cachedPost !== undefined) {
        return cachedPost;
    }

    // fail-fast：后端错误应中止构建（与 listAllPosts 等一致），而非静默发布缺失该文章的站点。
    // 注意「找不到该 key/locale 的变体」是正常情况，返回 null；只有 getPostIndexByGroup 抛错才会冒泡。
    const index = await getPostIndexByGroup();
    const post = index.get(key)?.[locale] ?? null;

    setCache(cacheKey, post);
    return post;
}

/**
 * 获取指定翻译组的所有语言版本
 * @param key - 翻译组 key
 * @returns 包含每个语言版本是否存在的记录
 */
export async function getVariantsByGroup(key: string): Promise<Record<Locale, Post | null>> {
    const cacheKey = CACHE_KEYS.variantsByGroup(key);

    const cachedVariants = getCache<Record<Locale, Post | null>>(cacheKey);
    if (cachedVariants !== undefined) {
        return cachedVariants;
    }

    // fail-fast：后端错误应中止构建，而非返回看似「无翻译版本」的空结果。
    const index = await getPostIndexByGroup();
    const indexedVariants = index.get(key);
    const variants = createEmptyVariants();

    for (const locale of LOCALES) {
        variants[locale] = indexedVariants?.[locale] ?? null;
    }

    setCache(cacheKey, variants);

    return variants;
}

/**
 * 获取所有翻译组 key（处理分页，获取全部）
 * @returns 所有翻译组 key 的数组
 */
export async function listAllGroupKeys(): Promise<string[]> {
    const cacheKey = CACHE_KEYS.allGroupKeys();

    const cachedKeys = getCache<string[]>(cacheKey);
    if (cachedKeys !== undefined) {
        return cachedKeys;
    }

    // fail-fast：后端错误应中止构建，而非让 getStaticPaths 静默拿到 [] 而生成 0 篇详情页。
    const postIndex = await getPostIndexByGroup();
    const keysArray = Array.from(postIndex.keys());
    setCache(cacheKey, keysArray);

    return keysArray;
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
    const cacheKey = CACHE_KEYS.allPosts(include);

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
    const cacheKey = CACHE_KEYS.allPostsView(page, limit);

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
