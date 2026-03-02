'use client';

import { useAuthStore } from '../stores/authStore';

/**
 * Check if the current user has ALL of the specified permissions.
 */
export function usePermission(...requiredPermissions: string[]): boolean {
    const user = useAuthStore((s) => s.user);

    if (!user?.role?.permissions) return false;

    return requiredPermissions.every((p) => user.role!.permissions.includes(p));
}

/**
 * Check if the current user has the specified role.
 */
export function useRole(roleName: string): boolean {
    const user = useAuthStore((s) => s.user);
    return user?.role?.name === roleName;
}
