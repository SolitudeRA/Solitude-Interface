import {GhostAPIClient} from "./ghostApiClient";
import type {AxiosError} from "axios";

interface IndexHighlightPostsResponse {
    posts: IndexHighlightPost[];
}

export interface IndexHighlightPost {
    title: string;
    url: URL;
    feature_image: URL;
    published_at: string;
}

const ghostApiClient = new GhostAPIClient();

export async function indexGetHighlightPosts(limit: number = 4, fields: string = "title,url,feature_image,published_at"): Promise<IndexHighlightPost[]> {
    try {
        const response = await ghostApiClient
            .get<IndexHighlightPostsResponse>({
                                                  endpoint: "/posts/",
                                                  params: {
                                                      limit,
                                                      fields
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