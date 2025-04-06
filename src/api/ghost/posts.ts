import {ProxyWorkers} from "api/utilities";
import type {AxiosError} from "axios";
import {GhostAPIClient} from "../clients/ghost";

interface IndexHighlightPostsResponse {
    posts: IndexHighlightPost[];
}

export interface IndexHighlightPost {
    id: string;
    title: string;
    url: URL;
    feature_image: URL;
    primary_tag?: PostTag;
    tags?: PostTag[];
    published_at: string;
    post_type: string;
    post_category: string;
    post_series: string;
    post_general_tags?: string[];
}

interface PostsResponse {
    posts: Post[];
}

export interface Post {
    id: string;
    title: string;
    url: URL;
    feature_image: URL;
    primary_tag?: PostTag;
    tags?: PostTag[];
    published_at: string;
    comment_id: string;
    excerpt: string;
    html: string;
    post_type: string;
    post_category: string;
    post_series: string;
    post_general_tags?: string[];
}

export interface PostTag {
    slug: string;
    id: string;
    name: string;
    description?: string;
    feature_image?: string;
    url?: URL;
}

const postTypePrefix = "type-";
const postCategoryPrefix = "category-";
const postSeriesPrefix = "series-";

export const POST_TYPE = {
    DEFAULT: "default",
    ARTICLE: "article",
    MUSIC: "music",
    VIDEO: "video",
    GALLERY: "gallery"
}

const ghostApiClient = new GhostAPIClient();
const utilities = new ProxyWorkers();

export async function indexGetHighlightPosts(limit: number = 12, fields: string = "id,title,url,feature_image,primary_tag,published_at", include: string = "tags"): Promise<IndexHighlightPost[]> {
    try {
        const {posts} = await ghostApiClient
            .get<IndexHighlightPostsResponse>({
                                                  endpoint: "/posts/",
                                                  params: {
                                                      limit,
                                                      fields,
                                                      include
                                                  }
                                              });
        return posts.map((post) => ({
            ...post,
            url: utilities.convertPostIdToFrontendUrl(post.id),
            feature_image: utilities.convertToWorkersUrl(post.feature_image),
            post_type: getTagSlugWith(post.tags, postTypePrefix),
            post_category: getTagSlugWith(post.tags, postCategoryPrefix),
            post_series: getTagNameWith(post.tags, postSeriesPrefix),
            post_general_tags: getTagNameExcept(post.tags, [postTypePrefix, postCategoryPrefix, postSeriesPrefix])
        }));
    } catch (error) {
        handleError(error);
    }
}

export async function getPosts(include: string = "tags"): Promise<Post[]> {
    try {
        const {posts} = await ghostApiClient
            .get<PostsResponse>({
                                    endpoint: "/posts/",
                                    params: {
                                        include
                                    }
                                });
        return posts.map((post) => ({
            ...post,
            feature_image: utilities.convertToWorkersUrl(post.feature_image),
            post_type: getTagSlugWith(post.tags, postTypePrefix),
            post_category: getTagSlugWith(post.tags, postCategoryPrefix),
            post_series: getTagNameWith(post.tags, postSeriesPrefix),
            post_general_tags: getTagNameExcept(post.tags, [postTypePrefix, postCategoryPrefix, postSeriesPrefix])
        }));
    } catch (error) {
        handleError(error);
    }
}

function getTagSlugWith(tags: PostTag[] | undefined, tagPrefix: string): string {
    return tags?.find((tag) => tag.slug.startsWith(tagPrefix))?.slug.replace(tagPrefix, "") ?? "default";
}

function getTagNameWith(tags: PostTag[] | undefined, tagPrefix: string): string {
    return tags?.find((tag) => tag.slug.startsWith(tagPrefix))?.name ?? "default";
}

function getTagNameExcept(tags: PostTag[] | undefined, tagPrefixes: string[]): string[] {
    return tags?.filter((tag) => !tagPrefixes.some((prefix) => tag.slug.startsWith(prefix)))
               .map((tag) => tag.name) ?? [];
}


function handleError(error: unknown): never {
    if ((error as AxiosError).isAxiosError) {
        const axiosError = error as AxiosError;
        console.error("API Error:", axiosError.response?.data || axiosError.message);
    } else {
        console.error("Unexpected Error:", (error as Error).message);
    }
    throw error;
}