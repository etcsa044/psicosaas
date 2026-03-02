import { AlertTriangle, XCircle } from 'lucide-react';

interface ConflictModalProps {
    type: 'alert' | 'block';
    message: string;
    onConfirm?: () => void;
    onCancel: () => void;
}

export function ConflictModal({ type, message, onConfirm, onCancel }: ConflictModalProps) {
    const isBlock = type === 'block';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 overflow-auto" onClick={onCancel}>
            <div
                className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 m-4"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex flex-col items-center text-center">
                    {isBlock ? (
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
                            <XCircle size={32} />
                        </div>
                    ) : (
                        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4 text-amber-600 dark:text-amber-400">
                            <AlertTriangle size={32} />
                        </div>
                    )}

                    <h3 className={`text-xl font-bold mb-2 ${isBlock ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-500'}`}>
                        {isBlock ? 'Acción Bloqueada' : 'Advertencia de Frecuencia'}
                    </h3>

                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
                        {message}
                    </p>

                    <div className="flex gap-3 w-full justify-center">
                        <button
                            onClick={onCancel}
                            className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${isBlock
                                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 w-full'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 w-1/2'
                                }`}
                        >
                            {isBlock ? 'Entendido' : 'Cancelar'}
                        </button>

                        {!isBlock && onConfirm && (
                            <button
                                onClick={onConfirm}
                                className="w-1/2 px-5 py-2.5 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 focus:ring-4 focus:ring-amber-300 transition-colors"
                            >
                                Forzar Turno
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
