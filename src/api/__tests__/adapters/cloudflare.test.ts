import { describe, it, expect, vi } from 'vitest';
import {
    adaptURLToResourceWorkers,
    adaptClientToZeroTrust,
} from '@api/adapters/cloudflare';
import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

describe('Cloudflare Adapters', () => {
    describe('adaptURLToResourceWorkers', () => {
        it('should replace hostname with Resource Workers URL', () => {
            const originalUrl = new URL('https://example.com/path/to/resource');
            const adaptedUrl = adaptURLToResourceWorkers(originalUrl);

            expect(adaptedUrl.hostname).toBe(
                'test-resource-workers.example.com',
            );
            expect(adaptedUrl.pathname).toBe('/path/to/resource');
            expect(adaptedUrl.protocol).toBe('https:');
        });

        it('should preserve original URL path and query parameters', () => {
            const originalUrl = new URL(
                'https://example.com/images/photo.jpg?size=large',
            );
            const adaptedUrl = adaptURLToResourceWorkers(originalUrl);

            expect(adaptedUrl.pathname).toBe('/images/photo.jpg');
            expect(adaptedUrl.search).toBe('?size=large');
        });

        it('should not modify the original URL object', () => {
            const originalUrl = new URL('https://example.com/resource');
            const originalHostname = originalUrl.hostname;

            adaptURLToResourceWorkers(originalUrl);

            expect(originalUrl.hostname).toBe(originalHostname);
        });
    });

    describe('adaptClientToZeroTrust', () => {
        it('should add Cloudflare Access authentication headers', async () => {
            const mockClient = axios.create() as AxiosInstance;
            let capturedConfig: InternalAxiosRequestConfig | undefined;

            // Mock interceptor
            mockClient.interceptors.request.use = vi.fn(
                (interceptor: any) => {
                    capturedConfig = interceptor({
                        headers: {},
                    } as InternalAxiosRequestConfig);
                    return 0; // Return interceptor ID
                },
            );

            adaptClientToZeroTrust(mockClient);

            expect(mockClient.interceptors.request.use).toHaveBeenCalled();
            expect(capturedConfig?.headers['CF-Access-Client-Id']).toBe(
                'test-access-id',
            );
            expect(capturedConfig?.headers['CF-Access-Client-Secret']).toBe(
                'test-access-secret',
            );
        });

        it('should preserve existing headers', async () => {
            const mockClient = axios.create() as AxiosInstance;
            let capturedConfig: InternalAxiosRequestConfig | undefined;

            mockClient.interceptors.request.use = vi.fn(
                (interceptor: any) => {
                    capturedConfig = interceptor({
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: 'Bearer token',
                        },
                    } as InternalAxiosRequestConfig);
                    return 0;
                },
            );

            adaptClientToZeroTrust(mockClient);

            expect(capturedConfig?.headers['Content-Type']).toBe(
                'application/json',
            );
            expect(capturedConfig?.headers['Authorization']).toBe(
                'Bearer token',
            );
            expect(capturedConfig?.headers['CF-Access-Client-Id']).toBe(
                'test-access-id',
            );
        });

        it('should return the modified client instance', () => {
            const mockClient = axios.create();
            const result = adaptClientToZeroTrust(mockClient);

            expect(result).toBe(mockClient);
        });
    });
});
