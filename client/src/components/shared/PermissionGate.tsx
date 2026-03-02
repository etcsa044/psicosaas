'use client';

import { ReactNode } from 'react';
import { usePermission } from '@/features/auth/hooks/usePermission';

interface PermissionGateProps {
    permissions: string[];
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * Conditionally render children based on user permissions.
 * Backend remains the final authority — this is UX-only.
 */
export function PermissionGate({ permissions, children, fallback = null }: PermissionGateProps) {
    const hasPermission = usePermission(...permissions);

    if (!hasPermission) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
