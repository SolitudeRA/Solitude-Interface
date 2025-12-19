import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    GhostAPIClient,
    getGhostClient,
    resetGhostClient,
} from '@api/clients/ghost';
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Mock handleApiError
vi.mock('@api/utils/errorHandlers', () => ({
    handleApiError: vi.fn((error) => {
        throw new Error(`API Error: ${error.message || 'Unknown'}`);
    }),
}));

describe('GhostAPIClient', () => {
    const createMockAxiosInstance = (overrides = {}) => ({
        request: vi.fn(),
        interceptors: {
            request: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
            response: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
        },
        ...overrides,
    });

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(axios.create).mockReturnValue(
            createMockAxiosInstance() as any,
        );
    });

    describe('constructor', () => {
        it('should correctly initialize axios instance', () => {
            const client = new GhostAPIClient();
            expect(client).toBeInstanceOf(GhostAPIClient);
        });

        it('should accept custom retry configuration', () => {
            const client = new GhostAPIClient({
                maxRetries: 5,
                retryDelay: 2000,
            });
            expect(client).toBeInstanceOf(GhostAPIClient);
        });
    });

    describe('get', () => {
        it('should successfully fetch data', async () => {
            const mockData = {
                posts: [
                    { id: '1', title: 'Test Post 1' },
                    { id: '2', title: 'Test Post 2' },
                ],
            };

            const mockRequest = vi.fn().mockResolvedValue({ data: mockData });
            vi.mocked(axios.create).mockReturnValue(
                createMockAxiosInstance({ request: mockRequest }) as any,
            );

            const client = new GhostAPIClient();
            const result = await client.get({
                endpoint: '/posts/',
            });

            expect(result).toEqual(mockData);
            expect(mockRequest).toHaveBeenCalledWith({
                method: 'GET',
                url: '/posts/',
                params: undefined,
            });
        });

        it('should pass params correctly', async () => {
            const mockData = { posts: [] };
            const mockRequest = vi.fn().mockResolvedValue({ data: mockData });
            vi.mocked(axios.create).mockReturnValue(
                createMockAxiosInstance({ request: mockRequest }) as any,
            );

            const client = new GhostAPIClient();
            await client.get({
                endpoint: '/posts/',
                params: { limit: 10, page: 1 },
            });

            expect(mockRequest).toHaveBeenCalledWith({
                method: 'GET',
                url: '/posts/',
                params: { limit: 10, page: 1 },
            });
        });

        it('should handle API errors', async () => {
            const error = new Error('API Error');
            (error as any).isAxiosError = true;

            const mockRequest = vi.fn().mockRejectedValue(error);
            vi.mocked(axios.create).mockReturnValue(
                createMockAxiosInstance({ request: mockRequest }) as any,
            );
            vi.mocked(axios.isAxiosError).mockReturnValue(false);

            const client = new GhostAPIClient({ maxRetries: 1 });

            await expect(
                client.get({
                    endpoint: '/posts/',
                }),
            ).rejects.toThrow();
        });
    });

    describe('retry mechanism', () => {
        it('should retry on network error', async () => {
            const networkError = new Error('Network Error');
            const mockData = { posts: [] };

            const mockRequest = vi
                .fn()
                .mockRejectedValueOnce(networkError)
                .mockResolvedValueOnce({ data: mockData });

            vi.mocked(axios.create).mockReturnValue(
                createMockAxiosInstance({ request: mockRequest }) as any,
            );
            vi.mocked(axios.isAxiosError).mockReturnValue(true);

            const client = new GhostAPIClient({
                maxRetries: 3,
                retryDelay: 10, // 使用短延迟加速测试
            });
            const result = await client.get({ endpoint: '/posts/' });

            expect(result).toEqual(mockData);
            expect(mockRequest).toHaveBeenCalledTimes(2);
        });

        it('should retry on retryable status codes', async () => {
            const serverError = new Error('Server Error');
            (serverError as any).response = { status: 503 };
            const mockData = { posts: [] };

            const mockRequest = vi
                .fn()
                .mockRejectedValueOnce(serverError)
                .mockResolvedValueOnce({ data: mockData });

            vi.mocked(axios.create).mockReturnValue(
                createMockAxiosInstance({ request: mockRequest }) as any,
            );
            vi.mocked(axios.isAxiosError).mockReturnValue(true);

            const client = new GhostAPIClient({
                maxRetries: 3,
                retryDelay: 10,
            });
            const result = await client.get({ endpoint: '/posts/' });

            expect(result).toEqual(mockData);
            expect(mockRequest).toHaveBeenCalledTimes(2);
        });

        it('should not retry on non-retryable status codes', async () => {
            const clientError = new Error('Not Found');
            (clientError as any).response = { status: 404 };

            const mockRequest = vi.fn().mockRejectedValue(clientError);

            vi.mocked(axios.create).mockReturnValue(
                createMockAxiosInstance({ request: mockRequest }) as any,
            );
            vi.mocked(axios.isAxiosError).mockReturnValue(true);

            const client = new GhostAPIClient({
                maxRetries: 3,
                retryDelay: 10,
            });

            await expect(
                client.get({ endpoint: '/posts/' }),
            ).rejects.toThrow();
            expect(mockRequest).toHaveBeenCalledTimes(1);
        });

        it('should stop retrying after max retries', async () => {
            const networkError = new Error('Network Error');

            const mockRequest = vi.fn().mockRejectedValue(networkError);

            vi.mocked(axios.create).mockReturnValue(
                createMockAxiosInstance({ request: mockRequest }) as any,
            );
            vi.mocked(axios.isAxiosError).mockReturnValue(true);

            const client = new GhostAPIClient({
                maxRetries: 3,
                retryDelay: 10,
            });

            await expect(
                client.get({ endpoint: '/posts/' }),
            ).rejects.toThrow();
            expect(mockRequest).toHaveBeenCalledTimes(3);
        });
    });

    describe('singleton instance', () => {
        beforeEach(() => {
            resetGhostClient();
        });

        it('should return a GhostAPIClient instance via getGhostClient', () => {
            const client = getGhostClient();
            expect(client).toBeInstanceOf(GhostAPIClient);
        });

        it('should return the same instance on multiple calls', () => {
            const client1 = getGhostClient();
            const client2 = getGhostClient();
            expect(client1).toBe(client2);
        });

        it('should create new instance after reset', () => {
            const client1 = getGhostClient();
            resetGhostClient();
            const client2 = getGhostClient();
            expect(client1).not.toBe(client2);
        });
    });
});
