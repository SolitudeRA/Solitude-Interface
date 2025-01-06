import {GhostAPIClient} from "./ghostApiClient";
import type {AxiosError} from "axios";

const ghostApiClient = new GhostAPIClient();

interface IndexHighlightPostsResponse {
    posts: IndexHighlightPost[];
}

interface IndexHighlightPost {
    title: string;
    url: string;
    feature_image: string;
    published_at: string;
}

export async function indexGetHighlightPosts(limit: number = 10, fields: string = "title,url,feature_image,published_at"): Promise<IndexHighlightPost[]> {
    try {
        const response = await ghostApiClient
            .get<IndexHighlightPostsResponse>({
                                                  endpoint: "posts/",
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