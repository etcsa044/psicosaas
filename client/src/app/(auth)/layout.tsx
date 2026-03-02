import { cookies } from 'next/headers';
import { AuthProvider } from '@/features/auth/components/AuthProvider';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    const hasSession = cookieStore.has('refreshToken');

    return (
        <AuthProvider hasSession={hasSession}>
            {children}
        </AuthProvider>
    );
}
