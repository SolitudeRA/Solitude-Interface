import {ProxyWorkers} from "@apiClients/utilities";
import type {AxiosError} from "axios";
import {GhostAPIClient} from "./ghostApiClient";

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
    html: string;
    post_type: string;
    post_category: string;
    post_series: string;
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
        const response = await ghostApiClient
            .get<IndexHighlightPostsResponse>({
                                                  endpoint: "/posts/",
                                                  params: {
                                                      limit,
                                                      fields,
                                                      include
                                                  }
                                              });
        return response.posts.map((post) => {
            return {
                ...post,
                url: utilities.convertPostIdToFrontendUrl(post.id),
                feature_image: utilities.convertToWorkersUrl(post.feature_image),
                post_type: getFilteredTagSlug(post.tags, postTypePrefix),
                post_category: getFilteredTagSlug(post.tags, postCategoryPrefix),
                post_series: getFilteredTagName(post.tags, postSeriesPrefix)
            };
        });
    } catch (error) {
        handleError(error);
    }
}

export async function getPosts(include: string = "tags"): Promise<Post[]> {
    try {
        const response = await ghostApiClient
            .get<PostsResponse>({
                                    endpoint: "/posts/",
                                    params: {
                                        include
                                    }
                                });
        return response.posts.map((post) => {
            return {
                ...post,
                feature_image: utilities.convertToWorkersUrl(post.feature_image),
                post_type: getFilteredTagSlug(post.tags, postTypePrefix),
                post_category: getFilteredTagSlug(post.tags, postCategoryPrefix),
                post_series: getFilteredTagName(post.tags, postSeriesPrefix)
            };
        });
    } catch (error) {
        handleError(error);
    }
}

function getFilteredTagSlug(tags: PostTag[] | undefined, tagPrefix: string): string {
    if (tags === undefined) {
        return "default";
    }
    const filteredTags = tags.filter((tag) => tag.slug.startsWith(tagPrefix));

    return filteredTags[0] === undefined || filteredTags.length === 0 ? "default" : filteredTags[0].slug.replace(tagPrefix, "");
}

function getFilteredTagName(tags: PostTag[] | undefined, tagPrefix: string): string {
    if (tags === undefined) {
        return "default";
    }
    const filteredTags = tags.filter((tag) => tag.slug.startsWith(tagPrefix));

    return filteredTags[0] === undefined || filteredTags.length === 0 ? "default" : filteredTags[0].name;
}

function handleError(error: any): never {
    if (error.isAxiosError) {
        const axiosError = error as AxiosError;
        console.error("API Error:", axiosError.response?.data || axiosError.message);
    } else {
        console.error("Unexpected Error:", error.message);
    }
    throw error;
}