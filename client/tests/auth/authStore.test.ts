/**
 * Test: Auth store behavior
 * - setAuth stores user and sets authenticated
 * - clearAuth removes user and sets unauthenticated
 * - currentTenantId is set from JWT
 */
import { useAuthStore } from '@/features/auth/stores/authStore';

describe('Auth Store', () => {
    beforeEach(() => {
        useAuthStore.setState({
            user: null,
            status: 'loading',
            currentTenantId: null,
        });
    });

    it('should start in loading state', () => {
        const state = useAuthStore.getState();
        expect(state.status).toBe('loading');
        expect(state.user).toBeNull();
        expect(state.currentTenantId).toBeNull();
    });

    it('should set user and status on setAuth', () => {
        const mockUser = {
            _id: 'user-123',
            email: 'test@test.com',
            tenantId: 'tenant-456',
            roleId: 'role-789',
            profile: { firstName: 'Test', lastName: 'User' },
        };

        useAuthStore.getState().setAuth(mockUser);

        const state = useAuthStore.getState();
        expect(state.status).toBe('authenticated');
        expect(state.user).toEqual(mockUser);
        expect(state.currentTenantId).toBe('tenant-456');
    });

    it('should clear everything on clearAuth', () => {
        // First set auth
        useAuthStore.getState().setAuth({
            _id: 'user-123',
            email: 'test@test.com',
            tenantId: 'tenant-456',
            roleId: 'role-789',
        });

        // Then clear
        useAuthStore.getState().clearAuth();

        const state = useAuthStore.getState();
        expect(state.status).toBe('unauthenticated');
        expect(state.user).toBeNull();
        expect(state.currentTenantId).toBeNull();
    });

    it('should set status independently', () => {
        useAuthStore.getState().setStatus('unauthenticated');
        expect(useAuthStore.getState().status).toBe('unauthenticated');
    });
});
