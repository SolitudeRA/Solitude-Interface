import { env } from '@api/config/env';
import type { FeaturedPost, Post, PostTag } from '@api/ghost/types';

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
    post_general_tags: string[];
}

export function adaptGhostPost<T extends Post | FeaturedPost>(post: T): T {
    const tagInfo = extractTagInfo(post.tags);

    return {
        ...post,
        url: convertPostIdToFrontendUrl(post.id),
        feature_image: post.feature_image,
        ...tagInfo,
    };
}

function convertPostIdToFrontendUrl(id: string): URL {
    return new URL(`${env.site.url}/posts/${id}`);
}

/**
 * 从标签数组中提取所有标签信息
 */
function extractTagInfo(tags: PostTag[] | undefined): TagInfo {
    const result: TagInfo = {
        post_type: DEFAULT_TAG_VALUE,
        post_category: DEFAULT_TAG_VALUE,
        post_series: DEFAULT_TAG_VALUE,
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
        } else if (!slug.startsWith(TAG_PREFIXES.HASH)) {
            result.post_general_tags.push(name);
        }
    }

    return result;
}
