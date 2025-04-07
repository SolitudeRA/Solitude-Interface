import { GhostAPIClient } from '@api/clients/ghost';
import { adaptGhostPost } from '@api/adapters/ghost';
import type { HighlightPost, Post } from '@api/ghost/types';
import { handleApiError } from '@api/utils/errorHandlers';

const ghostApiClient = new GhostAPIClient();

export async function indexGetHighlightPosts(
    limit: number = 12,
    fields: string = 'id,title,url,feature_image,primary_tag,published_at',
    include: string = 'tags',
): Promise<HighlightPost[]> {
    try {
        const posts = await ghostApiClient.get<HighlightPost[]>({
            endpoint: '/posts/',
            params: { limit, fields, include },
        });

        return posts.map((post) => adaptGhostPost(post));
    } catch (error) {
        return handleApiError(error);
    }
}

export async function getPosts(include: string = 'tags'): Promise<Post[]> {
    try {
        const posts = await ghostApiClient.get<Post[]>({
            endpoint: '/posts/',
            params: { include },
        });

        return posts.map((post) => adaptGhostPost(post));
    } catch (error) {
        return handleApiError(error);
    }
}