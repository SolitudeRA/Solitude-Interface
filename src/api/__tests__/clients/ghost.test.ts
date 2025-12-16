import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GhostAPIClient } from '@api/clients/ghost';
import axios from 'axios';

// Mock axios
vi.mock('axios');

describe('GhostAPIClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock axios.create to return a proper mock
        vi.mocked(axios.create).mockReturnValue({
            get: vi.fn(),
            interceptors: {
                request: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
                response: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
            },
        } as any);
    });

    describe('constructor', () => {
        it('should correctly initialize axios instance', () => {
            const client = new GhostAPIClient();
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

            vi.mocked(axios.create).mockReturnValue({
                get: vi.fn().mockResolvedValue({ data: mockData }),
                interceptors: {
                    request: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
                    response: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
                },
            } as any);

            const client = new GhostAPIClient();
            const result = await client.get({
                endpoint: '/posts/',
            });

            expect(result).toEqual(mockData);
        });

        it('should handle API errors', async () => {
            const error = new Error('API Error');
            (error as any).isAxiosError = true;

            vi.mocked(axios.create).mockReturnValue({
                get: vi.fn().mockRejectedValue(error),
                interceptors: {
                    request: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
                    response: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
                },
            } as any);

            vi.mocked(axios.isAxiosError).mockReturnValue(true);

            const client = new GhostAPIClient();

            await expect(
                client.get({
                    endpoint: '/posts/',
                }),
            ).rejects.toThrow();
        });
    });
});
