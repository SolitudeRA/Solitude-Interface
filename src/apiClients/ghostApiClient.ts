import dotenv from 'dotenv'
import axios from "axios";
import type {AxiosInstance} from "axios";

interface GhostApiClientConfig {
    url: string;
    key: string;
    version: string;
    accessClientId: string;
    accessClientSecret: string;
}

interface GhostApiClientOptions {
    endpoint: string;
    params?: Record<string, any>;
}

dotenv.config()

export class GhostAPIClient {
    private config: GhostApiClientConfig;
    private axiosInstance: AxiosInstance;

    constructor() {
        assertEnvVar('GHOST_URL', process.env.GHOST_URL);
        assertEnvVar('GHOST_KEY', process.env.GHOST_KEY);
        assertEnvVar('GHOST_VERSION', process.env.GHOST_VERSION);
        assertEnvVar('ACCESS_CLIENT_ID', process.env.ACCESS_CLIENT_ID);
        assertEnvVar('ACCESS_CLIENT_SECRET', process.env.ACCESS_CLIENT_SECRET);

        this.config = {
            url: process.env.GHOST_URL,
            key: process.env.GHOST_KEY,
            version: process.env.GHOST_VERSION,
            accessClientId: process.env.ACCESS_CLIENT_ID,
            accessClientSecret: process.env.ACCESS_CLIENT_SECRET
        }

        this.axiosInstance = axios
            .create({
                        baseURL: `${this.config.url}/ghost/api/content/`,
                        timeout: 1000,
                        params: {
                            key: this.config.key
                        },
                        headers: {
                            'CF-Access-Client-Id': this.config.accessClientId,
                            'CF-Access-Client-Secret': this.config.accessClientSecret,
                            'Accept-Version': this.config.version
                        },
                        responseType: 'json'
                    });
    }

    async get<T = any>(options: GhostApiClientOptions): Promise<T> {
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
            console.error("API Error:", {
                message: error.message,
                endpoint: error.config?.url,
                params: error.config?.params,
                status: error.response?.status,
                data: error.response?.data,
            });
        } else {
            console.error("Unexpected Error:", {
                message: error.message,
            });
        }
        throw error;
    }
}

function assertEnvVar(name: string, value: string | undefined): asserts value is string {
    if (!value) {
        throw new Error(`Environment variable ${name} is not set`);
    }
}