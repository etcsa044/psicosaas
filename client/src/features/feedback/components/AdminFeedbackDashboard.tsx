'use client';

import { useEffect, useState } from 'react';
import { feedbackApi, Feedback } from '../api/feedbackApi';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminFeedbackDashboard() {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFeedbacks = async () => {
            try {
                const data = await feedbackApi.getFeedbacks();
                setFeedbacks(data);
            } catch (error) {
                console.error("Error fetching feedbacks:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFeedbacks();
    }, []);

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'bug': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'feature': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'improvement': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'bug': return 'Problema / Bug';
            case 'feature': return 'Nueva Función';
            case 'improvement': return 'Mejora';
            default: return type;
        }
    };

    if (isLoading) {
        return (
            <div className="p-6 max-w-5xl mx-auto flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        📨 Buzón de Sugerencias
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Revisá el feedback enviado desde tu aplicación para mejorar la experiencia.
                    </p>
                </div>
                <div className="text-center px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <span className="block text-2xl font-bold text-indigo-700 dark:text-indigo-400">{feedbacks.length}</span>
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-500 uppercase tracking-wider">Mensajes</span>
                </div>
            </div>

            {feedbacks.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center shadow-sm">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                        <span className="text-3xl">📭</span>
                    </div>
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Bandeja Vacía</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Todavía no recibiste ningún mensaje de feedback.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {feedbacks.map((item) => (
                        <div key={item._id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <div className="p-5">
                                <div className="flex justify-between items-start gap-4 mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                                            {getTypeLabel(item.type)}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {format(new Date(item.createdAt), "d 'de' MMMM, yyyy - HH:mm", { locale: es })}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                        Ruta: {item.metadata?.path || '/'}
                                    </span>
                                </div>

                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    {item.title}
                                </h3>

                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                    {item.description}
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xs font-medium text-indigo-700 dark:text-indigo-400">
                                            {item.user?.profile?.firstName?.[0] || 'U'}
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {item.user?.profile?.firstName} {item.user?.profile?.lastName}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-500">
                                            ({item.user?.email})
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
