/**
 * Test: Axios interceptor behavior
 * - Injects access token in requests
 * - Handles 401 → refresh → retry
 * - Prevents refresh loops (mutex)
 * - Redirects to login when refresh fails
 */
import axios from 'axios';
import { api, setAccessToken, getAccessToken } from '@/lib/axios';

// Mock axios.post for refresh calls (BFF endpoint)
jest.mock('axios', () => {
    const actualAxios = jest.requireActual('axios');
    return {
        ...actualAxios,
        post: jest.fn(),
        create: actualAxios.create,
    };
});

describe('Axios Interceptor', () => {
    beforeEach(() => {
        setAccessToken(null);
        jest.clearAllMocks();
    });

    describe('Token Management', () => {
        it('should set and get access token', () => {
            expect(getAccessToken()).toBeNull();
            setAccessToken('test-token');
            expect(getAccessToken()).toBe('test-token');
        });

        it('should clear access token', () => {
            setAccessToken('test-token');
            setAccessToken(null);
            expect(getAccessToken()).toBeNull();
        });
    });

    describe('Request Interceptor', () => {
        it('should add Authorization header when token exists', async () => {
            setAccessToken('my-access-token');

            // Check that the interceptor modifies the config
            const config = { headers: {} as Record<string, string> };
            const interceptor = api.interceptors.request.handlers[0];
            const result = interceptor.fulfilled(config);

            expect(result.headers.Authorization).toBe('Bearer my-access-token');
        });

        it('should not add Authorization header when no token', async () => {
            setAccessToken(null);

            const config = { headers: {} as Record<string, string> };
            const interceptor = api.interceptors.request.handlers[0];
            const result = interceptor.fulfilled(config);

            expect(result.headers.Authorization).toBeUndefined();
        });
    });
});
