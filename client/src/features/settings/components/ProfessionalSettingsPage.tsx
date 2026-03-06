'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface SettingsData {
    defaultRules: {
        weeklyFrequencyPolicy: {
            mode: 'none' | 'alert' | 'block';
            maxPerWeek?: number;
        };
        appointmentDurationMinutes: number;
        cancellationAlertThreshold?: number;
        cancellationAlertWindowDays?: number;
    };
}

function useSettings() {
    return useQuery<SettingsData>({
        queryKey: ['professional-settings'],
        queryFn: async () => {
            const { data } = await api.get('/professional-settings');
            return data.data;
        },
    });
}

export default function ProfessionalSettingsPage() {
    const queryClient = useQueryClient();
    const { data: settings, isLoading, isError } = useSettings();

    const [duration, setDuration] = useState(45);
    const [freqMode, setFreqMode] = useState<'none' | 'alert' | 'block'>('alert');
    const [maxPerWeek, setMaxPerWeek] = useState(1);
    const [cancelThreshold, setCancelThreshold] = useState(3);
    const [cancelWindow, setCancelWindow] = useState(30);

    useEffect(() => {
        if (settings) {
            setDuration(settings.defaultRules.appointmentDurationMinutes);
            setFreqMode(settings.defaultRules.weeklyFrequencyPolicy.mode);
            setMaxPerWeek(settings.defaultRules.weeklyFrequencyPolicy.maxPerWeek || 1);
            setCancelThreshold(settings.defaultRules.cancellationAlertThreshold || 3);
            setCancelWindow(settings.defaultRules.cancellationAlertWindowDays || 30);
        }
    }, [settings]);

    const mutation = useMutation({
        mutationFn: async (payload: Partial<SettingsData>) => {
            const { data } = await api.patch('/professional-settings', payload);
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['professional-settings'] });
            toast.success('Configuración guardada');
        },
        onError: () => {
            toast.error('Error al guardar la configuración');
        },
    });

    const handleSave = () => {
        mutation.mutate({
            defaultRules: {
                appointmentDurationMinutes: duration,
                weeklyFrequencyPolicy: {
                    mode: freqMode,
                    ...(freqMode !== 'none' ? { maxPerWeek } : {}),
                },
                cancellationAlertThreshold: cancelThreshold,
                cancellationAlertWindowDays: cancelWindow,
            },
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-center py-16 text-red-500">
                Error cargando configuración. Verificá que el servidor esté corriendo.
            </div>
        );
    }

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ajustá tu agenda y reglas clínicas</p>
            </div>

            <div className="space-y-8">
                {/* Agenda Section */}
                <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📅 Agenda</h2>
                    <div className="grid gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Duración de turno (minutos)
                            </label>
                            <select
                                value={duration}
                                onChange={(e) => setDuration(Number(e.target.value))}
                                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value={30}>30 minutos</option>
                                <option value={45}>45 minutos</option>
                                <option value={60}>60 minutos</option>
                                <option value={90}>90 minutos</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Clinical Rules Section */}
                <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">⚕️ Reglas Clínicas</h2>
                    <div className="grid gap-6">
                        {/* Frequency Policy */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Política de frecuencia semanal
                            </label>
                            <select
                                value={freqMode}
                                onChange={(e) => setFreqMode(e.target.value as 'none' | 'alert' | 'block')}
                                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="none">Sin restricción</option>
                                <option value="alert">Alerta (permite override)</option>
                                <option value="block">Bloqueo (no permite)</option>
                            </select>
                        </div>

                        {freqMode !== 'none' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Máximo de turnos por semana
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={maxPerWeek}
                                    onChange={(e) => setMaxPerWeek(Number(e.target.value))}
                                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        )}

                        {/* Cancellation Alert */}
                        <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Alerta de cancelaciones</h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Umbral de cancelaciones
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={cancelThreshold}
                                        onChange={(e) => setCancelThreshold(Number(e.target.value))}
                                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Nro. de cancelaciones para activar alerta</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Ventana de tiempo (días)
                                    </label>
                                    <input
                                        type="number"
                                        min={7}
                                        max={365}
                                        value={cancelWindow}
                                        onChange={(e) => setCancelWindow(Number(e.target.value))}
                                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Período en días para contar cancelaciones</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={mutation.isPending}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                        {mutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Guardar Configuración
                    </button>
                </div>
            </div>
        </div>
    );
}
