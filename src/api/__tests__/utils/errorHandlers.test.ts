import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { handleApiError } from '@api/utils/errorHandlers';
import axios, { AxiosError } from 'axios';

describe('Error Handlers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock console.error to avoid cluttering test output
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('handleApiError', () => {
        it('should handle Axios errors and throw formatted error', () => {
            const axiosError: Partial<AxiosError> = {
                isAxiosError: true,
                message: 'Request failed',
                response: {
                    status: 404,
                    statusText: 'Not Found',
                    data: { error: 'Resource not found' },
                    headers: {},
                    config: {
                        headers: {} as any,
                    },
                },
                config: {
                    url: '/api/test',
                    params: { id: 123 },
                    headers: {} as any,
                },
            };

            expect(() => handleApiError(axiosError)).toThrow(
                'API request failed: 404 - Request failed',
            );
        });

        it('should log Axios error details to console', () => {
            const consoleSpy = vi.spyOn(console, 'error');
            const axiosError: Partial<AxiosError> = {
                isAxiosError: true,
                message: 'Network Error',
                response: {
                    status: 500,
                    statusText: 'Internal Server Error',
                    data: {},
                    headers: {},
                    config: {
                        headers: {} as any,
                    },
                },
                config: {
                    url: '/api/posts',
                    headers: {} as any,
                },
            };

            try {
                handleApiError(axiosError);
            } catch (e) {
                // Expected to throw
            }

            expect(consoleSpy).toHaveBeenCalledWith(
                'API Error:',
                expect.objectContaining({
                    message: 'Network Error',
                    status: 500,
                }),
            );
        });

        it('should handle Axios errors without response', () => {
            const axiosError: Partial<AxiosError> = {
                isAxiosError: true,
                message: 'Network Error',
                config: {
                    url: '/api/test',
                    headers: {} as any,
                },
            };

            expect(() => handleApiError(axiosError)).toThrow(
                'API request failed: undefined - Network Error',
            );
        });

        it('should handle Axios errors without config', () => {
            const axiosError: Partial<AxiosError> = {
                isAxiosError: true,
                message: 'Unknown Error',
                response: {
                    status: 400,
                    statusText: 'Bad Request',
                    data: {},
                    headers: {},
                    config: {
                        headers: {} as any,
                    },
                },
            };

            expect(() => handleApiError(axiosError)).toThrow(
                'API request failed: 400 - Unknown Error',
            );
        });

        it('should handle errors with response data', () => {
            const consoleSpy = vi.spyOn(console, 'error');
            const errorData = {
                message: 'Validation failed',
                errors: ['Field is required'],
            };

            const axiosError: Partial<AxiosError> = {
                isAxiosError: true,
                message: 'Bad Request',
                response: {
                    status: 400,
                    statusText: 'Bad Request',
                    data: errorData,
                    headers: {},
                    config: {
                        headers: {} as any,
                    },
                },
                config: {
                    url: '/api/posts',
                    headers: {} as any,
                },
            };

            try {
                handleApiError(axiosError);
            } catch (e) {
                // Expected to throw
            }

            expect(consoleSpy).toHaveBeenCalledWith(
                'API Error:',
                expect.objectContaining({
                    data: errorData,
                }),
            );
        });

        it('should handle non-Axios errors', () => {
            const genericError = new Error('Something went wrong');

            expect(() => handleApiError(genericError)).toThrow(
                'Unknown error: Something went wrong',
            );
        });

        it('should log non-Axios errors to console', () => {
            const consoleSpy = vi.spyOn(console, 'error');
            const genericError = new Error('Generic error');

            try {
                handleApiError(genericError);
            } catch (e) {
                // Expected to throw
            }

            expect(consoleSpy).toHaveBeenCalledWith(
                'Unknown error:',
                genericError,
            );
        });

        it('should handle error objects without message', () => {
            const errorWithoutMessage = {};

            expect(() => handleApiError(errorWithoutMessage)).toThrow(
                'Unknown error: No information',
            );
        });

        it('should handle string errors', () => {
            const stringError = 'String error message';

            expect(() => handleApiError(stringError)).toThrow(
                'Unknown error: No information',
            );
        });

        it('should handle null or undefined', () => {
            expect(() => handleApiError(null)).toThrow(
                'Unknown error: No information',
            );

            expect(() => handleApiError(undefined)).toThrow(
                'Unknown error: No information',
            );
        });

        it('should include endpoint information in error', () => {
            const consoleSpy = vi.spyOn(console, 'error');
            const axiosError: Partial<AxiosError> = {
                isAxiosError: true,
                message: 'Forbidden',
                response: {
                    status: 403,
                    statusText: 'Forbidden',
                    data: {},
                    headers: {},
                    config: {
                        headers: {} as any,
                    },
                },
                config: {
                    url: '/api/settings',
                    params: { fields: 'all' },
                    headers: {} as any,
                },
            };

            try {
                handleApiError(axiosError);
            } catch (e) {
                // Expected to throw
            }

            expect(consoleSpy).toHaveBeenCalledWith(
                'API Error:',
                expect.objectContaining({
                    url: '/api/settings',
                }),
            );
        });

        it('should handle different HTTP status codes', () => {
            const statusCodes = [400, 401, 403, 404, 500, 502, 503];

            statusCodes.forEach((status) => {
                const axiosError: Partial<AxiosError> = {
                    isAxiosError: true,
                    message: `Error ${status}`,
                    response: {
                        status,
                        statusText: `Status ${status}`,
                        data: {},
                        headers: {},
                        config: {
                            headers: {} as any,
                        },
                    },
                    config: {
                        headers: {} as any,
                    },
                };

                expect(() => handleApiError(axiosError)).toThrow(
                    `API request failed: ${status}`,
                );
            });
        });

        it('should use axios.isAxiosError to check error type', () => {
            const isAxiosErrorSpy = vi.spyOn(axios, 'isAxiosError');

            const error = new Error('Test');
            try {
                handleApiError(error);
            } catch (e) {
                // Expected to throw
            }

            expect(isAxiosErrorSpy).toHaveBeenCalledWith(error);
        });
    });
});
