import { env } from '@api/config/env';
import type { FeaturedPost, Post, PostTag } from '@api/ghost/types';
import { buildPostPathFromPost, extractI18nKeyFromPost } from '@lib/i18n';

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
    post_category: string;
    post_series: string;
    post_series_number: string;
    post_general_tags: string[];
}

export function adaptGhostPost<T extends Post | FeaturedPost>(post: T): T {
    const tagInfo = extractTagInfo(post.tags);
    const seriesNumber = extractSeriesNumberFromPost(post, tagInfo.post_series_number);

    return {
        ...post,
        url: convertPostToFrontendUrl(post),
        feature_image: post.feature_image,
        ...tagInfo,
        post_series_number: seriesNumber,
    };
}

function convertPostToFrontendUrl(post: Pick<Post | FeaturedPost, 'id' | 'slug' | 'tags'>): URL {
    return new URL(buildPostPathFromPost(post), env.site.url);
}

/**
 * 从标签数组中提取所有标签信息
 */
function extractTagInfo(tags: PostTag[] | undefined): TagInfo {
    const result: TagInfo = {
        post_type: DEFAULT_TAG_VALUE,
        post_category: DEFAULT_TAG_VALUE,
        post_series: DEFAULT_TAG_VALUE,
        post_series_number: '',
        post_general_tags: [],
    };

    if (!tags?.length) return result;

    for (const tag of tags) {
        const { slug, name } = tag;

        if (slug.startsWith(TAG_PREFIXES.TYPE)) {
            result.post_type = slug.replace(TAG_PREFIXES.TYPE, '');
        } else if (slug.startsWith(TAG_PREFIXES.CATEGORY)) {
            result.post_category = slug.replace(TAG_PREFIXES.CATEGORY, '');
        } else if (slug.startsWith(TAG_PREFIXES.SERIES)) {
            result.post_series = name;
            result.post_series_number = extractSeriesNumberFromSlug(slug);
        } else if (!slug.startsWith(TAG_PREFIXES.HASH)) {
            result.post_general_tags.push(name);
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
