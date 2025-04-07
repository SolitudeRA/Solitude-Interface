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
            `API 请求失败: ${errorInfo.status} - ${errorInfo.message}`,
        );
    }

    console.error('意外错误:', error);
    throw new Error(`未知错误: ${(error as Error).message || '没有错误信息'}`);
}