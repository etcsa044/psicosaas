import { create } from 'zustand';

export interface AuthUser {
    _id: string;
    email: string;
    tenantId: string;
    roleId: string;
    profile?: {
        firstName: string;
        lastName: string;
    };
    role?: {
        name: string;
        permissions: string[];
    };
}

interface AuthState {
    user: AuthUser | null;
    status: 'loading' | 'authenticated' | 'unauthenticated';
    currentTenantId: string | null; // Prepared for future multi-org

    setAuth: (user: AuthUser) => void;
    clearAuth: () => void;
    setStatus: (status: AuthState['status']) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    status: 'loading',
    currentTenantId: null,

    setAuth: (user) =>
        set({
            user,
            status: 'authenticated',
            currentTenantId: user.tenantId,
        }),

    clearAuth: () =>
        set({
            user: null,
            status: 'unauthenticated',
            currentTenantId: null,
        }),

    setStatus: (status) => set({ status }),
}));
