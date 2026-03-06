'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { getQueryClient } from '@/lib/queryClient';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/hooks/useTheme';

export function Providers({ children }: { children: ReactNode }) {
    const queryClient = getQueryClient();

    return (
        <ThemeProvider>
            <QueryClientProvider client={queryClient}>
                {children}
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            borderRadius: '0.75rem',
                            padding: '0.75rem 1rem',
                            fontSize: '0.875rem',
                        },
                    }}
                />
            </QueryClientProvider>
        </ThemeProvider>
    );
}
