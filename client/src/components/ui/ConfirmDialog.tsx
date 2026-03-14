'use client';

import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string | React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'destructive' | 'warning' | 'default';
    onConfirm: () => void;
    loading?: boolean;
}

const variantConfig = {
    destructive: {
        icon: Trash2,
        iconBg: 'bg-red-100 dark:bg-red-900/40',
        iconColor: 'text-red-600 dark:text-red-400',
        buttonBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    },
    warning: {
        icon: AlertTriangle,
        iconBg: 'bg-amber-100 dark:bg-amber-900/40',
        iconColor: 'text-amber-600 dark:text-amber-400',
        buttonBg: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
    },
    default: {
        icon: AlertTriangle,
        iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
        iconColor: 'text-indigo-600 dark:text-indigo-400',
        buttonBg: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
    },
};

export default function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    variant = 'default',
    onConfirm,
    loading = false,
}: ConfirmDialogProps) {
    if (!open) return null;

    const config = variantConfig[variant];
    const Icon = config.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="alertdialog" aria-modal="true">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={() => !loading && onOpenChange(false)}
            />

            {/* Dialog */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-scale-in">
                <div className={`w-14 h-14 ${config.iconBg} ${config.iconColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Icon size={28} />
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {title}
                </h3>

                <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    {description}
                </div>

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl transition-colors disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`px-5 py-2.5 text-sm font-medium text-white ${config.buttonBg} rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2`}
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
