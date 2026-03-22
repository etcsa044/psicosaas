'use client';

import { useGoogleStatus, useDisconnectGoogle, useUpdateGoogleSettings } from '../hooks/useGoogleIntegration';
import { Loader2, ExternalLink, Unplug, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

export default function GoogleCalendarCard() {
    const { data: status, isLoading } = useGoogleStatus();
    const { mutateAsync: disconnect, isPending: disconnecting } = useDisconnectGoogle();
    const { mutateAsync: updateSettings } = useUpdateGoogleSettings();

    // Listen for redirect back from Google OAuth
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const googleResult = params.get('google');
        if (googleResult === 'success') {
            toast.success('¡Google Calendar conectado exitosamente!');
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
        } else if (googleResult === 'error') {
            toast.error('Error al conectar Google Calendar. Intentá de nuevo.');
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const handleConnect = () => {
        // Redirect to our backend OAuth endpoint
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
        window.location.href = `${backendUrl}/api/integrations/google/auth`;
    };

    const handleDisconnect = async () => {
        try {
            await disconnect();
            toast.success('Google Calendar desconectado');
        } catch {
            toast.error('Error al desconectar');
        }
    };

    const handleToggleMeet = async () => {
        try {
            await updateSettings({ autoMeet: !status?.autoMeet });
            toast.success(status?.autoMeet ? 'Google Meet desactivado' : 'Google Meet activado');
        } catch {
            toast.error('Error al actualizar configuración');
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                <div className="flex items-center justify-center h-20">
                    <Loader2 className="animate-spin w-5 h-5 text-gray-400" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    {/* Google Calendar Icon */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                        G
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Google Calendar
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Sincronizar turnos y enviar invitaciones por Gmail
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-5">
                {status?.connected ? (
                    <>
                        {/* Connected State */}
                        <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                                    <span className="text-green-600 text-sm">✓</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-green-800 dark:text-green-300">Conectado</p>
                                    <p className="text-xs text-green-600 dark:text-green-400">{status.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleDisconnect}
                                disabled={disconnecting}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                                {disconnecting ? <Loader2 size={14} className="animate-spin" /> : <Unplug size={14} />}
                                Desconectar
                            </button>
                        </div>

                        {/* Auto Meet Toggle */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                                    <Video size={16} className="text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Google Meet Automático</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Generar link de videollamada para turnos online</p>
                                </div>
                            </div>
                            <button
                                onClick={handleToggleMeet}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    status.autoMeet 
                                        ? 'bg-indigo-600' 
                                        : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                                        status.autoMeet ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>

                        {/* Info */}
                        <div className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                            💡 Al confirmar un turno, se creará automáticamente un evento en tu Google Calendar y el paciente recibirá una invitación por email.
                        </div>
                    </>
                ) : (
                    <>
                        {/* Disconnected State */}
                        <div className="text-center py-4">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                                <span className="text-3xl">📅</span>
                            </div>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                                Conectá tu Google Calendar
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-5">
                                Sincronizá tus turnos, enviá invitaciones automáticas por Gmail y generá links de Google Meet.
                            </p>
                            <button
                                onClick={handleConnect}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-md shadow-indigo-600/20 transition-colors"
                            >
                                <ExternalLink size={16} />
                                Conectar con Google
                            </button>
                        </div>

                        {/* Benefits */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                            {[
                                { icon: '📧', title: 'Invitaciones', desc: 'Email automático al paciente' },
                                { icon: '🔔', title: 'Recordatorios', desc: 'Google envía alertas previas' },
                                { icon: '💻', title: 'Google Meet', desc: 'Link automático para videollamadas' },
                            ].map((b) => (
                                <div key={b.title} className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                                    <span className="text-xl">{b.icon}</span>
                                    <p className="text-xs font-semibold text-gray-900 dark:text-white mt-1">{b.title}</p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{b.desc}</p>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
