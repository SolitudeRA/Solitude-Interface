import { env } from '@api/config/env';
import { adaptToResourceWorkers } from '@api/adapters/cloudflare';
import type { HighlightPost, Post, PostTag } from '@api/ghost/types';

const TAG_PREFIXES = {
    TYPE: 'type-',
    CATEGORY: 'category-',
    SERIES: 'series-',
};

export function adaptGhostPost<T extends Post | HighlightPost>(post: T): T {
    return {
        ...post,
        url: convertPostIdToFrontendUrl(post.id),
        feature_image: adaptToResourceWorkers(post.feature_image),
        post_type: getTagSlugWith(post.tags, TAG_PREFIXES.TYPE),
        post_category: getTagSlugWith(post.tags, TAG_PREFIXES.CATEGORY),
        post_series: getTagNameWith(post.tags, TAG_PREFIXES.SERIES),
        post_general_tags: getTagNameExcept(
            post.tags,
            Object.values(TAG_PREFIXES),
        ),
    };
}

function convertPostIdToFrontendUrl(id: string): URL {
    return new URL(`${env.site.url}/posts/${id}`);
}

function getTagSlugWith(
    tags: PostTag[] | undefined,
    tagPrefix: string,
): string {
    return (
        tags
            ?.find((tag) => tag.slug.startsWith(tagPrefix))
            ?.slug.replace(tagPrefix, '') ?? 'default'
    );
}

function getTagNameWith(
    tags: PostTag[] | undefined,
    tagPrefix: string,
): string {
    return (
        tags?.find((tag) => tag.slug.startsWith(tagPrefix))?.name ?? 'default'
    );
}

function getTagNameExcept(
    tags: PostTag[] | undefined,
    tagPrefixes: string[],
): string[] {
    if (!tags?.length) return [];

    return tags
        .filter(
            (tag) => !tagPrefixes.some((prefix) => tag.slug.startsWith(prefix)),
        )
        .map((tag) => tag.name);
}
