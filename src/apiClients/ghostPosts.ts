import {GhostAPIClient} from "./ghostApiClient";
import type {AxiosError} from "axios";

interface IndexHighlightPostsResponse {
    posts: IndexHighlightPost[];
}

export interface IndexHighlightPost {
    title: string;
    url: URL;
    feature_image: URL;
    primary_tag?: PostTag;
    tags?: PostTag[];
    published_at: string;
}

export interface PostTag {
    slug?: string;
    id?: string;
    name: string;
    description?: string;
    feature_image?: string;
    url?: URL;
}

const ghostApiClient = new GhostAPIClient();

export async function indexGetHighlightPosts(limit: number = 4, fields: string = "title,url,feature_image,primary_tag,published_at", include: string = "tags"): Promise<IndexHighlightPost[]> {
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
        return response.posts;
    } catch (error) {
        handleError(error);
    }
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