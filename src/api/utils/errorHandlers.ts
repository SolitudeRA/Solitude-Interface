import type { AxiosError } from 'axios';
import axios from 'axios';

/**
 * 判断是否为开发环境
 * 在服务端渲染时使用 import.meta.env.DEV
 */
const isDevelopment = (): boolean => {
    try {
        return import.meta.env?.DEV ?? false;
    } catch {
        return false;
    }
};

/**
 * 安全的错误日志输出
 * 仅在开发环境输出详细错误信息，生产环境输出简化信息
 */
function logError(message: string, details?: unknown): void {
    if (isDevelopment()) {
        console.error(message, details);
    } else {
        // 生产环境只记录基本信息，避免泄露敏感数据
        console.error(message);
    }
}

export function handleApiError(error: unknown): never {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const errorInfo = {
            message: axiosError.message,
            status: axiosError.response?.status,
            data: axiosError.response?.data,
            url: axiosError.config?.url,
        };

        logError('API Error:', errorInfo);

        // 生产环境返回通用错误消息，开发环境返回详细信息
        const userMessage = isDevelopment()
            ? `API request failed: ${errorInfo.status} - ${errorInfo.message}`
            : `API request failed: ${errorInfo.status || 'Unknown error'}`;

        throw new Error(userMessage);
    }

    logError('Unknown error:', error);
    const errorMessage = isDevelopment()
        ? (error as Error)?.message || 'No information'
        : 'An unexpected error occurred';
    throw new Error(`Unknown error: ${errorMessage}`);
}
