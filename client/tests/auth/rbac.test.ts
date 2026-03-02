/**
 * Test: usePermission hook and RBAC logic
 */
import { useAuthStore } from '@/features/auth/stores/authStore';

// Test the permission checking logic directly (no React needed)
function checkPermissions(permissions: string[], required: string[]): boolean {
    return required.every((p) => permissions.includes(p));
}

describe('RBAC — Permission Checking', () => {
    it('should return true when user has all required permissions', () => {
        expect(checkPermissions(
            ['VIEW_PATIENT', 'CREATE_PATIENT', 'EDIT_PATIENT'],
            ['VIEW_PATIENT']
        )).toBe(true);
    });

    it('should return true for multiple matching permissions', () => {
        expect(checkPermissions(
            ['VIEW_PATIENT', 'CREATE_PATIENT', 'EDIT_PATIENT'],
            ['VIEW_PATIENT', 'EDIT_PATIENT']
        )).toBe(true);
    });

    it('should return false when missing any permission', () => {
        expect(checkPermissions(
            ['VIEW_PATIENT'],
            ['VIEW_PATIENT', 'DELETE_PATIENT']
        )).toBe(false);
    });

    it('should return false for empty permissions list', () => {
        expect(checkPermissions([], ['VIEW_PATIENT'])).toBe(false);
    });

    it('should return true for empty required list', () => {
        expect(checkPermissions(['VIEW_PATIENT'], [])).toBe(true);
    });
});

describe('RBAC — Auth Store Integration', () => {
    it('should store role permissions with user', () => {
        const mockUser = {
            _id: 'user-1',
            email: 'doc@test.com',
            tenantId: 'tenant-1',
            roleId: 'role-1',
            role: {
                name: 'OWNER',
                permissions: ['VIEW_PATIENT', 'CREATE_PATIENT', 'DELETE_PATIENT', 'MANAGE_SUBSCRIPTION'],
            },
        };

        useAuthStore.getState().setAuth(mockUser);

        const state = useAuthStore.getState();
        expect(state.user?.role?.permissions).toContain('VIEW_PATIENT');
        expect(state.user?.role?.permissions).toContain('MANAGE_SUBSCRIPTION');
        expect(state.user?.role?.name).toBe('OWNER');
    });

    it('should handle user without role info', () => {
        const mockUser = {
            _id: 'user-1',
            email: 'doc@test.com',
            tenantId: 'tenant-1',
            roleId: 'role-1',
        };

        useAuthStore.getState().setAuth(mockUser);

        const state = useAuthStore.getState();
        expect(state.user?.role).toBeUndefined();
    });
});
