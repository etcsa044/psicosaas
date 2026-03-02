'use client';

import { useState, useEffect, useCallback } from 'react';

export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}

export function useDarkMode() {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('darkMode');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldBeDark = stored ? stored === 'true' : prefersDark;

        setIsDark(shouldBeDark);
        document.documentElement.classList.toggle('dark', shouldBeDark);
    }, []);

    const toggle = useCallback(() => {
        setIsDark((prev) => {
            const next = !prev;
            localStorage.setItem('darkMode', String(next));
            document.documentElement.classList.toggle('dark', next);
            return next;
        });
    }, []);

    return { isDark, toggle };
}
