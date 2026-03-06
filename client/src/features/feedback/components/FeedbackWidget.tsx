'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { MessageSquarePlus, X, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const feedbackTypes = [
    { value: 'bug', label: '🐛 Bug', description: 'Algo no funciona bien' },
    { value: 'improvement', label: '✨ Mejora', description: 'Algo podría ser mejor' },
    { value: 'idea', label: '💡 Idea', description: 'Tengo una sugerencia nueva' },
    { value: 'other', label: '💬 Otro', description: 'Comentario general' },
];

export default function FeedbackWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [type, setType] = useState('improvement');
    const [message, setMessage] = useState('');

    const mutation = useMutation({
        mutationFn: async (payload: { type: string; message: string; page: string; metadata: object }) => {
            const { data } = await api.post('/feedback', payload);
            return data;
        },
        onSuccess: () => {
            toast.success('¡Gracias por tu feedback! Lo revisaremos pronto.');
            setMessage('');
            setType('improvement');
            setIsOpen(false);
        },
        onError: () => {
            toast.error('Error al enviar feedback. Intentá de nuevo.');
        },
    });

    const handleSubmit = () => {
        if (!message.trim()) {
            toast.error('Escribí un mensaje antes de enviar');
            return;
        }
        mutation.mutate({
            type,
            message: message.trim(),
            page: typeof window !== 'undefined' ? window.location.pathname : '',
            metadata: {
                browser: typeof navigator !== 'undefined' ? navigator.userAgent : '',
                viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '',
            },
        });
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 text-sm font-semibold"
                title="Enviar Feedback"
            >
                <MessageSquarePlus size={18} />
                <span className="hidden sm:inline">Feedback</span>
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
                    <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-800">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Enviar Feedback</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {feedbackTypes.map((ft) => (
                                        <button
                                            key={ft.value}
                                            onClick={() => setType(ft.value)}
                                            className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${type === ft.value
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'
                                                }`}
                                        >
                                            <span className="font-medium">{ft.label}</span>
                                            <p className="text-xs mt-0.5 opacity-70">{ft.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mensaje</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Contanos qué encontraste o qué te gustaría mejorar..."
                                    rows={4}
                                    maxLength={2000}
                                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition"
                                />
                                <p className="text-xs text-gray-400 mt-1 text-right">{message.length}/2000</p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={mutation.isPending || !message.trim()}
                                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                                {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                Enviar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
