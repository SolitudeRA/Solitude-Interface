import axios from 'axios';
import { env } from '@api/config/env';
import type { AxiosInstance } from 'axios';

interface GhostClientOptions {
    endpoint: string;
    params?: Record<string, any>;
}

export class GhostAPIClient {
    private axiosInstance: AxiosInstance;

    constructor() {
        this.axiosInstance = axios.create({
            baseURL: `${env.ghost.url}/ghost/api/content/`,
            timeout: 5000,
            params: {
                key: env.ghost.key,
            },
            headers: {
                'Accept-Version': env.ghost.version,
                'CF-Access-Client-Id': env.ghost.accessId,
                'CF-Access-Client-Secret': env.ghost.accessSecret,
            },
            responseType: 'json',
        });
    }

    public async get<T = any>(options: GhostClientOptions): Promise<T> {
        try {
            const response = await this.axiosInstance.get<T>(options.endpoint, {
                params: options.params,
            });
            return response.data;
        } catch (error: any) {
            this.handleError(error);
        }
    }

    private handleError(error: any): never {
        if (axios.isAxiosError(error)) {
            const errorInfo = {
                message: error.message,
                endpoint: error.config?.url,
                params: error.config?.params,
                status: error.response?.status,
                data: error.response?.data,
            };

            console.error('API Error:', errorInfo);
            throw new Error(
                `Ghost API Error: ${errorInfo.status} - ${errorInfo.message}`,
            );
        } else {
            console.error('Unexpected Error:', error);
            throw error;
        }
    }
}
