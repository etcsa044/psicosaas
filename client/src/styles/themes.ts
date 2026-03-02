export type ThemeId = 'blue' | 'terracotta' | 'dark' | 'green' | 'neutral';

export interface ThemePalette {
    id: ThemeId;
    name: string;
    colors: {
        primary: string;
        primaryLight: string;
        accent: string;
        background: string;
        backgroundDark: string;
        surface: string;
        surfaceDark: string;
        text: string;
        textDark: string;
        textMuted: string;
        textMutedDark: string;
        border: string;
        borderDark: string;
        success: string;
        warning: string;
        error: string;
    };
}

export const THEMES: ThemePalette[] = [
    {
        id: 'blue',
        name: 'Profesional Azul',
        colors: {
            primary: '#2563EB',
            primaryLight: '#3B82F6',
            accent: '#60A5FA',
            background: '#F8FAFC',
            backgroundDark: '#0F172A',
            surface: '#FFFFFF',
            surfaceDark: '#1E293B',
            text: '#0F172A',
            textDark: '#F1F5F9',
            textMuted: '#64748B',
            textMutedDark: '#94A3B8',
            border: '#E2E8F0',
            borderDark: '#334155',
            success: '#10B981',
            warning: '#F59E0B',
            error: '#EF4444',
        },
    },
    {
        id: 'terracotta',
        name: 'Cálido Terracota',
        colors: {
            primary: '#C2410C',
            primaryLight: '#EA580C',
            accent: '#FB923C',
            background: '#FFFBEB',
            backgroundDark: '#1C1917',
            surface: '#FFFFFF',
            surfaceDark: '#292524',
            text: '#1C1917',
            textDark: '#FEF3C7',
            textMuted: '#78716C',
            textMutedDark: '#A8A29E',
            border: '#E7E5E4',
            borderDark: '#44403C',
            success: '#10B981',
            warning: '#F59E0B',
            error: '#EF4444',
        },
    },
    {
        id: 'dark',
        name: 'Moderno Oscuro',
        colors: {
            primary: '#6366F1',
            primaryLight: '#818CF8',
            accent: '#A78BFA',
            background: '#F8FAFC',
            backgroundDark: '#030712',
            surface: '#FFFFFF',
            surfaceDark: '#111827',
            text: '#111827',
            textDark: '#F9FAFB',
            textMuted: '#6B7280',
            textMutedDark: '#9CA3AF',
            border: '#E5E7EB',
            borderDark: '#1F2937',
            success: '#10B981',
            warning: '#F59E0B',
            error: '#EF4444',
        },
    },
    {
        id: 'green',
        name: 'Sereno Verde',
        colors: {
            primary: '#059669',
            primaryLight: '#10B981',
            accent: '#34D399',
            background: '#F0FDF4',
            backgroundDark: '#022C22',
            surface: '#FFFFFF',
            surfaceDark: '#064E3B',
            text: '#022C22',
            textDark: '#ECFDF5',
            textMuted: '#6B7280',
            textMutedDark: '#9CA3AF',
            border: '#D1FAE5',
            borderDark: '#065F46',
            success: '#10B981',
            warning: '#F59E0B',
            error: '#EF4444',
        },
    },
    {
        id: 'neutral',
        name: 'Neutro Elegante',
        colors: {
            primary: '#7C3AED',
            primaryLight: '#8B5CF6',
            accent: '#A78BFA',
            background: '#FAFAFA',
            backgroundDark: '#0A0A0A',
            surface: '#FFFFFF',
            surfaceDark: '#171717',
            text: '#171717',
            textDark: '#FAFAFA',
            textMuted: '#737373',
            textMutedDark: '#A3A3A3',
            border: '#E5E5E5',
            borderDark: '#262626',
            success: '#10B981',
            warning: '#F59E0B',
            error: '#EF4444',
        },
    },
];

/**
 * Apply a theme palette as CSS custom properties on :root.
 */
export function applyTheme(themeId: ThemeId) {
    const theme = THEMES.find((t) => t.id === themeId);
    if (!theme) return;

    const root = document.documentElement;
    const { colors } = theme;

    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-primary-light', colors.primaryLight);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-bg', colors.background);
    root.style.setProperty('--color-bg-dark', colors.backgroundDark);
    root.style.setProperty('--color-surface', colors.surface);
    root.style.setProperty('--color-surface-dark', colors.surfaceDark);
    root.style.setProperty('--color-text', colors.text);
    root.style.setProperty('--color-text-dark', colors.textDark);
    root.style.setProperty('--color-text-muted', colors.textMuted);
    root.style.setProperty('--color-text-muted-dark', colors.textMutedDark);
    root.style.setProperty('--color-border', colors.border);
    root.style.setProperty('--color-border-dark', colors.borderDark);
    root.style.setProperty('--color-success', colors.success);
    root.style.setProperty('--color-warning', colors.warning);
    root.style.setProperty('--color-error', colors.error);
}

export function getThemeById(id: ThemeId): ThemePalette | undefined {
    return THEMES.find((t) => t.id === id);
}
