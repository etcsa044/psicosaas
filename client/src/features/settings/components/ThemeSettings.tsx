'use client';

import { useTheme } from '@/hooks/useTheme';
import { Monitor, Moon, Sun, Palette, Check } from 'lucide-react';

export default function ThemeSettings() {
    const { theme, palette, setTheme, setPalette } = useTheme();

    const themes = [
        { id: 'light', label: 'Claro', icon: Sun },
        { id: 'dark', label: 'Oscuro', icon: Moon },
        { id: 'system', label: 'Sistema', icon: Monitor },
    ] as const;

    const palettes = [
        { id: 'blue', label: 'Azul (Por defecto)', color: 'bg-blue-600' },
        { id: 'rose', label: 'Rosa', color: 'bg-rose-600' },
        { id: 'violet', label: 'Violeta', color: 'bg-violet-600' },
        { id: 'teal', label: 'Esmeralda', color: 'bg-teal-600' },
    ] as const;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4 mb-6">
                Apariencia y Colores
            </h2>

            <div className="space-y-8">
                {/* Theme Selection */}
                <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Modo de visualización</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {themes.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setTheme(id)}
                                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === id
                                        ? 'border-primary bg-primary/5 text-primary'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'
                                    }`}
                            >
                                <Icon className="w-8 h-8" />
                                <span className="text-sm font-medium">{label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Palette Selection */}
                <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                        <Palette className="w-4 h-4" /> Paleta de Colores
                    </h3>
                    <div className="flex flex-wrap gap-4">
                        {palettes.map(({ id, label, color }) => (
                            <button
                                key={id}
                                onClick={() => setPalette(id)}
                                title={label}
                                className={`group relative w-12 h-12 rounded-full ${color} shadow-sm transition-transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-${id}-500 dark:focus:ring-offset-gray-900 ${palette === id ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white dark:ring-offset-gray-900' : ''
                                    }`}
                            >
                                {palette === id && (
                                    <Check className="absolute inset-0 m-auto text-white w-5 h-5" />
                                )}
                            </button>
                        ))}
                    </div>
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                        Elegí un color de acento que te resulte cómodo y armónico para tu interfaz.
                    </p>
                </div>
            </div>
        </div>
    );
}
