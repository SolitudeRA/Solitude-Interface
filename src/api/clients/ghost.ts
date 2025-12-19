import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import { env } from '@api/config/env';
import { handleApiError } from '@api/utils/errorHandlers';

/** Ghost API 客户端请求选项 */
interface GhostClientOptions {
    endpoint: string;
    params?: Record<string, string | number | boolean>;
}

/** 重试配置选项 */
interface RetryConfig {
    maxRetries: number;
    retryDelay: number;
    retryableStatuses: number[];
}

/** 默认重试配置 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    retryableStatuses: [408, 429, 500, 502, 503, 504],
};

/**
 * Ghost Content API 客户端
 * 提供对 Ghost CMS 内容 API 的类型安全访问
 */
export class GhostAPIClient {
    private readonly axiosInstance: AxiosInstance;
    private readonly retryConfig: RetryConfig;

    constructor(retryConfig: Partial<RetryConfig> = {}) {
        this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };

        this.axiosInstance = axios.create({
            baseURL: `${env.ghost.url}/ghost/api/content/`,
            timeout: env.ghost.timeout,
            params: {
                key: env.ghost.key,
            },
            headers: {
                'Accept-Version': env.ghost.version,
            },
            responseType: 'json',
        });

        this.setupInterceptors();
    }

    /**
     * 发送 GET 请求到 Ghost API
     * @param options - 请求选项，包含 endpoint 和可选的 params
     * @returns Promise 包含响应数据
     */
    public async get<T>(options: GhostClientOptions): Promise<T> {
        return this.requestWithRetry<T>({
            method: 'GET',
            url: options.endpoint,
            params: options.params,
        });
    }

    /**
     * 带重试机制的请求方法
     */
    private async requestWithRetry<T>(
        config: AxiosRequestConfig,
        attempt: number = 1,
    ): Promise<T> {
        try {
            const response = await this.axiosInstance.request<T>(config);
            return response.data;
        } catch (error: unknown) {
            if (this.shouldRetry(error, attempt)) {
                const delay = this.calculateRetryDelay(attempt);
                await this.sleep(delay);
                return this.requestWithRetry<T>(config, attempt + 1);
            }
            handleApiError(error);
        }
    }

    /**
     * 判断是否应该重试请求
     */
    private shouldRetry(error: unknown, attempt: number): boolean {
        if (attempt >= this.retryConfig.maxRetries) {
            return false;
        }

        if (axios.isAxiosError(error)) {
            // 网络错误或可重试的状态码
            if (!error.response) {
                return true; // 网络错误
            }
            return this.retryConfig.retryableStatuses.includes(
                error.response.status,
            );
        }

        return false;
    }

    /**
     * 计算重试延迟时间（指数退避）
     */
    private calculateRetryDelay(attempt: number): number {
        return this.retryConfig.retryDelay * Math.pow(2, attempt - 1);
    }

    /**
     * 延迟执行
     */
    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * 设置请求/响应拦截器
     */
    private setupInterceptors(): void {
        // 请求拦截器 - 可用于日志记录或添加通用请求头
        this.axiosInstance.interceptors.request.use(
            (config) => {
                // 可以在这里添加请求日志
                return config;
            },
            (error: unknown) => {
                return Promise.reject(error);
            },
        );

        // 响应拦截器 - 可用于统一处理响应
        this.axiosInstance.interceptors.response.use(
            (response) => {
                return response;
            },
            (error: unknown) => {
                return Promise.reject(error);
            },
        );
    }
}

/** 默认的 Ghost API 客户端单例实例（懒加载） */
let _ghostClient: GhostAPIClient | null = null;

/**
 * 获取 Ghost API 客户端单例实例
 * 使用懒加载模式，首次调用时创建实例
 */
export function getGhostClient(): GhostAPIClient {
    if (!_ghostClient) {
        _ghostClient = new GhostAPIClient();
    }
    return _ghostClient;
}

/**
 * 重置 Ghost API 客户端实例（主要用于测试）
 */
export function resetGhostClient(): void {
    _ghostClient = null;
}
