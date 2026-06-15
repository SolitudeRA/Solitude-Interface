import { env } from '@api/config/env';
import { safeCreateUrl } from '@api/utils/url';
import type { FeaturedPost, Post, PostTag } from '@api/ghost/types';
import {
    buildPostPathFromPost,
    DEFAULT_LOCALE,
    extractI18nKeyFromPost,
    extractLocaleFromPost,
    type Locale,
} from '@lib/i18n';
import { getTagLabel, localizeTag, localizeTags, type TagRegistry } from '@lib/tagRegistry';

const TAG_PREFIXES = {
    TYPE: 'type-',
    CATEGORY: 'category-',
    SERIES: 'series-',
    HASH: 'hash-',
} as const;

const DEFAULT_TAG_VALUE = 'default';

// 标签信息接口
interface TagInfo {
    post_type: string;
    post_type_label: string;
    post_category: string;
    post_category_label: string;
    post_series: string;
    post_series_slug: string;
    post_series_label: string;
    post_series_number: string;
    post_general_tags: string[];
    post_general_tag_slugs: string[];
}

interface AdaptGhostPostOptions {
    tagRegistry?: TagRegistry;
    locale?: Locale;
}

export function adaptGhostPost<T extends Post | FeaturedPost>(
    post: T,
    options: AdaptGhostPostOptions = {}
): T {
    const locale = options.locale ?? extractLocaleFromPost(post) ?? DEFAULT_LOCALE;
    const tagInfo = extractTagInfo(post.tags, locale, options.tagRegistry);
    const seriesNumber = extractSeriesNumberFromPost(post, tagInfo.post_series_number);

    return {
        ...post,
        url: convertPostToFrontendUrl(post),
        // 收敛外部 URL:字符串→URL 对象,畸形/缺失则为 null(类型 URL | null)
        feature_image: safeCreateUrl(post.feature_image),
        primary_tag: localizeTag(post.primary_tag, locale, options.tagRegistry),
        tags: localizeTags(post.tags, locale, options.tagRegistry),
        ...tagInfo,
        post_series_number: seriesNumber,
    };
}

/**
 * 校验来自 Ghost 的原始 post 是否具备适配所需的最小字段,过滤畸形条目,
 * 避免单条坏数据让整批适配崩溃(外部数据边界收敛)。
 */
export function isAdaptablePost(post: unknown): boolean {
    return (
        !!post &&
        typeof post === 'object' &&
        typeof (post as { id?: unknown }).id === 'string' &&
        typeof (post as { title?: unknown }).title === 'string'
    );
}

function convertPostToFrontendUrl(post: Pick<Post | FeaturedPost, 'id' | 'slug' | 'tags'>): URL {
    // 路径来自内部 i18nKey 规则;以站点 URL 为基准安全构造,异常时回退站点根
    return safeCreateUrl(buildPostPathFromPost(post), env.site.url) ?? new URL(env.site.url);
}

/**
 * 从标签数组中提取所有标签信息
 */
function extractTagInfo(
    tags: PostTag[] | undefined,
    locale: Locale,
    tagRegistry: TagRegistry = {}
): TagInfo {
    const result: TagInfo = {
        post_type: DEFAULT_TAG_VALUE,
        post_type_label: DEFAULT_TAG_VALUE,
        post_category: DEFAULT_TAG_VALUE,
        post_category_label: DEFAULT_TAG_VALUE,
        post_series: DEFAULT_TAG_VALUE,
        post_series_slug: '',
        post_series_label: DEFAULT_TAG_VALUE,
        post_series_number: '',
        post_general_tags: [],
        post_general_tag_slugs: [],
    };

    if (!tags?.length) return result;

    for (const tag of tags) {
        const { slug, name } = tag;
        const label = getTagLabel(slug, locale, name, tagRegistry);

        if (slug.startsWith(TAG_PREFIXES.TYPE)) {
            result.post_type = slug.replace(TAG_PREFIXES.TYPE, '');
            result.post_type_label = label;
        } else if (slug.startsWith(TAG_PREFIXES.CATEGORY)) {
            result.post_category = slug.replace(TAG_PREFIXES.CATEGORY, '');
            result.post_category_label = label;
        } else if (slug.startsWith(TAG_PREFIXES.SERIES)) {
            result.post_series = label;
            result.post_series_slug = slug;
            result.post_series_label = label;
            result.post_series_number = extractSeriesNumberFromSlug(slug);
        } else if (!slug.startsWith(TAG_PREFIXES.HASH)) {
            result.post_general_tags.push(label);
            result.post_general_tag_slugs.push(slug);
        }
    }

    return result;
}

function extractSeriesNumberFromSlug(slug: string): string {
    const match = slug.match(/-(\d+)$/);
    return match ? `#${match[1]}` : '';
}

function extractSeriesNumberFromPost<T extends Post | FeaturedPost>(
    post: T,
    fallbackSeriesNumber: string
): string {
    const seriesKey = extractSeriesKey(post.tags);
    if (!seriesKey) {
        return '';
    }

    const postKey = extractI18nKeyFromPost(post);
    const seriesNumber = extractSeriesNumberFromPostKey(postKey, seriesKey);

    return seriesNumber || fallbackSeriesNumber;
}

function extractSeriesKey(tags: PostTag[] | undefined): string {
    const seriesTag = tags?.find((tag) => tag.slug.startsWith(TAG_PREFIXES.SERIES));
    if (!seriesTag) {
        return '';
    }

    const seriesSlug = seriesTag.slug.replace(TAG_PREFIXES.SERIES, '');
    return seriesSlug.replace(/-\d+$/, '');
}

function extractSeriesNumberFromPostKey(
    postKey: string | null | undefined,
    seriesKey: string
): string {
    if (!postKey || !seriesKey) {
        return '';
    }

    const escapedSeriesKey = escapeRegExp(seriesKey);
    const match =
        postKey.match(new RegExp(`^${escapedSeriesKey}-(\\d+)$`)) ??
        postKey.match(new RegExp(`^${escapedSeriesKey}(\\d+)$`));

    return match?.[1] ? `#${match[1]}` : '';
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
