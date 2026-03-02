'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Global error:', error);
    }, [error]);

    return (
        <html>
            <body className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="mx-auto max-w-md text-center">
                    <div className="mb-6 text-6xl">😵</div>
                    <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Algo salió mal
                    </h1>
                    <p className="mb-6 text-gray-600 dark:text-gray-400">
                        Ocurrió un error inesperado. Intentá de nuevo o contactá soporte.
                    </p>
                    <button
                        onClick={reset}
                        className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
                    >
                        Reintentar
                    </button>
                </div>
            </body>
        </html>
    );
}
