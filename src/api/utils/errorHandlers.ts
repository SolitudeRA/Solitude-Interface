import type { AxiosError } from 'axios';
import axios from 'axios';

export function handleApiError(error: unknown): never {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const errorInfo = {
            message: axiosError.message,
            status: axiosError.response?.status,
            data: axiosError.response?.data,
            url: axiosError.config?.url,
        };

        console.error('API Error:', errorInfo);
        throw new Error(
            `API request failed: ${errorInfo.status} - ${errorInfo.message}`,
        );
    }

    console.error('Unknown error:', error);
    throw new Error(`Unknown error: ${(error as Error).message || 'No information'}`);
}