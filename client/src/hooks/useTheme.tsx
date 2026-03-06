'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';
type Palette = 'blue' | 'rose' | 'violet' | 'teal';

interface ThemeState {
    theme: Theme;
    palette: Palette;
    setTheme: (theme: Theme) => void;
    setPalette: (palette: Palette) => void;
}

export const useTheme = create<ThemeState>()(
    persist(
        (set) => ({
            theme: 'system',
            palette: 'blue',
            setTheme: (theme) => set({ theme }),
            setPalette: (palette) => set({ palette }),
        }),
        {
            name: 'psicosaas-theme',
        }
    )
);

import { useEffect } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { theme, palette } = useTheme();

    useEffect(() => {
        const root = window.document.documentElement;

        root.classList.remove('light', 'dark');

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.classList.add(systemTheme);
        } else {
            root.classList.add(theme);
        }

        root.setAttribute('data-theme', palette);

        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e: MediaQueryListEvent) => {
                if (e.matches) {
                    root.classList.add('dark');
                    root.classList.remove('light');
                } else {
                    root.classList.add('light');
                    root.classList.remove('dark');
                }
            };
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme, palette]);

    return <>{children}</>;
}
