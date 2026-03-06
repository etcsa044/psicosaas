'use client';

export default function FeedbackPage() {
    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Feedback</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Tu opinión nos ayuda a mejorar. Usá el botón flotante de Feedback en cualquier pantalla para enviarnos tus comentarios.
                </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center shadow-sm">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                    <span className="text-3xl">💬</span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">¿Encontraste algo para mejorar?</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    Podés enviar reportes de bugs, sugerencias de mejora o ideas nuevas directamente desde el botón
                    <span className="inline-flex items-center mx-1 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-full text-xs font-medium">
                        Feedback
                    </span>
                    que aparece en la esquina inferior derecha de todas las pantallas.
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">Cada feedback que enviás se registra con la página donde estabas, para que podamos reproducir y resolver el problema más rápido.</p>
            </div>
        </div>
    );
}
