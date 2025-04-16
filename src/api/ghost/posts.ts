import { GhostAPIClient } from '@api/clients/ghost';
import { adaptGhostPost } from '@api/adapters/ghost';
import type { FeaturedPost, Post } from '@api/ghost/types';
import { handleApiError } from '@api/utils/errorHandlers';
import { cacheService } from '@api/utils/cache';

const ghostApiClient = new GhostAPIClient();

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
        const posts = await ghostApiClient.get<FeaturedPost[]>({
            endpoint: '/posts/',
            params: { limit, fields, include },
        });

        const adaptedPosts = posts.map((post) => adaptGhostPost(post));

        cacheService.set(cacheKey, adaptedPosts);

        return adaptedPosts;
    } catch (error) {
        return handleApiError(error);
    }
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
        const posts = await ghostApiClient.get<Post[]>({
            endpoint: '/posts/',
            params: { include },
        });

        const adaptedPosts = posts.map((post) => adaptGhostPost(post));

        cacheService.set(cacheKey, adaptedPosts);

        return adaptedPosts;
    } catch (error) {
        return handleApiError(error);
    }
}
