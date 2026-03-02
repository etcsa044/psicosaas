import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
            <div className="mx-auto max-w-md text-center">
                <div className="mb-6 text-8xl font-bold text-gray-200 dark:text-gray-800">404</div>
                <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Página no encontrada
                </h1>
                <p className="mb-6 text-gray-600 dark:text-gray-400">
                    La página que buscás no existe o fue movida.
                </p>
                <Link
                    href="/dashboard"
                    className="inline-block rounded-lg bg-[var(--color-primary,#2563EB)] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
                >
                    Ir al inicio
                </Link>
            </div>
        </div>
    );
}
