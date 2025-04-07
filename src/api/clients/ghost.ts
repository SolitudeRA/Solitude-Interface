import dotenv from 'dotenv';
import axios from 'axios';
import type { AxiosInstance } from 'axios';

interface GhostClientConfig {
    url: string | undefined;
    key: string | undefined;
    version: string | undefined;
    accessClientId: string | undefined;
    accessClientSecret: string | undefined;
}

interface GhostClientOptions {
    endpoint: string;
    params?: Record<string, any>;
}

dotenv.config();

const envConfig = {
    GHOST_URL: process.env.GHOST_URL,
    GHOST_KEY: process.env.GHOST_KEY,
    GHOST_VERSION: process.env.GHOST_VERSION,
    ACCESS_CLIENT_ID: process.env.ACCESS_CLIENT_ID,
    ACCESS_CLIENT_SECRET: process.env.ACCESS_CLIENT_SECRET,
};

Object.entries(envConfig).forEach(([key, value]) => assertEnvVar(key, value));

export class GhostAPIClient {
    private config: GhostClientConfig;
    private axiosInstance: AxiosInstance;

    constructor() {
        this.config = {
            url: envConfig.GHOST_URL,
            key: envConfig.GHOST_KEY,
            version: envConfig.GHOST_VERSION,
            accessClientId: process.env.ACCESS_CLIENT_ID,
            accessClientSecret: process.env.ACCESS_CLIENT_SECRET,
        };

        this.axiosInstance = axios.create({
            baseURL: `${this.config.url}/ghost/api/content/`,
            timeout: 5000,
            params: {
                key: this.config.key,
            },
            headers: {
                'CF-Access-Client-Id': this.config.accessClientId,
                'CF-Access-Client-Secret': this.config.accessClientSecret,
                'Accept-Version': this.config.version,
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

function assertEnvVar(
    name: string,
    value: string | undefined,
): asserts value is string {
    if (!value) {
        throw new Error(`Environment variable ${name} is not set`);
    }
}
