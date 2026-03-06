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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { theme, palette } = useTheme();

    // Effect to apply theme (dark mode class)
    if (typeof window !== 'undefined') {
        const root = window.document.documentElement;

        // Handle dark mode
        root.classList.remove('light', 'dark');

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.classList.add(systemTheme);
        } else {
            root.classList.add(theme);
        }

        // Handle palette
        root.setAttribute('data-theme', palette);
    }

    // Watch for system theme changes if in system mode
    if (typeof window !== 'undefined' && theme === 'system') {
        window.matchMedia('(prefers-color-scheme: dark)').onchange = (e) => {
            const root = window.document.documentElement;
            if (e.matches) {
                root.classList.add('dark');
                root.classList.remove('light');
            } else {
                root.classList.add('light');
                root.classList.remove('dark');
            }
        };
    }

    return <>{children}</>;
}
