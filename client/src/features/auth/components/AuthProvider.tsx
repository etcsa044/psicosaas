'use client';

import { ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { setAccessToken } from '@/lib/axios';
import axios from 'axios';

interface AuthProviderProps {
    children: ReactNode;
    hasSession: boolean;
}

/**
 * AuthProvider handles hydration-safe auth state.
 * - Server checks cookie existence → passes `hasSession`
 * - If hasSession=true: attempts silent refresh on mount
 * - If hasSession=false: immediately sets unauthenticated
 */
export function AuthProvider({ children, hasSession }: AuthProviderProps) {
    const { setAuth, clearAuth, setStatus, status } = useAuthStore();

    useEffect(() => {
        if (!hasSession) {
            setStatus('unauthenticated');
            return;
        }

        // Silent refresh to restore access token
        async function silentRefresh() {
            try {
                const res = await axios.post(
                    '/api/auth/refresh',
                    {},
                    { headers: { 'x-csrf-protection': '1' } }
                );
                const { accessToken } = res.data;

                setAccessToken(accessToken);

                // Decode JWT payload to get user info (no verification needed, just reading)
                const payload = JSON.parse(atob(accessToken.split('.')[1]));
                setAuth({
                    _id: payload._id,
                    email: payload.email,
                    tenantId: payload.tenantId,
                    roleId: payload.roleId,
                });
            } catch {
                setAccessToken(null);
                clearAuth();
            }
        }

        silentRefresh();
    }, [hasSession, setAuth, clearAuth, setStatus]);

    // Show loading state while refreshing
    if (status === 'loading' && hasSession) {
        return (
            <div className="flex h-screen items-center justify-center bg-[var(--color-bg)] dark:bg-[var(--color-bg-dark)]">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
                    <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">
                        Cargando...
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
