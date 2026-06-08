import { env } from '@api/config/env';
import type { FeaturedPost, Post, PostTag } from '@api/ghost/types';
import { buildPostPathFromTags } from '@lib/i18n';

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

    return {
        ...post,
        url: convertPostToFrontendUrl(post.id, post.tags),
        feature_image: post.feature_image,
        ...tagInfo,
    };
}

function convertPostToFrontendUrl(id: string, tags: PostTag[] | undefined): URL {
    return new URL(buildPostPathFromTags(id, tags), env.site.url);
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
