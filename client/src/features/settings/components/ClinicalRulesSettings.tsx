"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useProfessionalSettings, IWeeklyFrequencyPolicy, IProfessionalSettings } from "../hooks/useProfessionalSettings";
import { useUpdateProfessionalSettings } from "../hooks/useUpdateProfessionalSettings";

export default function ClinicalRulesSettings() {
    const { data: settings, isLoading } = useProfessionalSettings();
    const { mutate: updateSettings, isPending } = useUpdateProfessionalSettings();

    const [formState, setFormState] = useState<{
        duration: number;
        defaultPolicy: IWeeklyFrequencyPolicy;
        overrides: Record<string, { weeklyFrequencyPolicy: IWeeklyFrequencyPolicy }>;
    } | null>(null);

    const [isAddingOverride, setIsAddingOverride] = useState(false);
    const [customTypeInput, setCustomTypeInput] = useState('');

    // Sync form state when data loads
    useEffect(() => {
        if (settings) {
            setFormState({
                duration: settings.defaultRules.appointmentDurationMinutes,
                defaultPolicy: settings.defaultRules.weeklyFrequencyPolicy,
                overrides: settings.patientTypeOverrides || {},
            });
        }
    }, [settings]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!formState) return null;

    const handleSave = () => {
        // Enforce valid payload
        const payload: Partial<IProfessionalSettings> = {
            defaultRules: {
                appointmentDurationMinutes: formState.duration,
                weeklyFrequencyPolicy: formState.defaultPolicy,
            },
            patientTypeOverrides: formState.overrides,
        };

        updateSettings(payload);
    };

    const confirmAddOverride = () => {
        const customType = customTypeInput.trim();
        if (!customType || formState?.overrides[customType]) {
            setIsAddingOverride(false);
            setCustomTypeInput('');
            return;
        }

        setFormState((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                overrides: {
                    ...prev.overrides,
                    [customType]: {
                        weeklyFrequencyPolicy: { mode: "alert", maxPerWeek: 1 },
                    },
                },
            };
        });
        setIsAddingOverride(false);
        setCustomTypeInput('');
    };

    const removeOverride = (key: string) => {
        setFormState((prev) => {
            if (!prev) return prev;
            const newOverrides = { ...prev.overrides };
            delete newOverrides[key];
            return { ...prev, overrides: newOverrides };
        });
    };

    const updateOverridePolicy = (key: string, field: keyof IWeeklyFrequencyPolicy, value: any) => {
        setFormState((prev) => {
            if (!prev) return prev;
            const updated = { ...prev };
            updated.overrides[key].weeklyFrequencyPolicy = {
                ...updated.overrides[key].weeklyFrequencyPolicy,
                [field]: value,
            };
            return updated;
        });
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Motor de Reglas Clínicas</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Configurá las políticas globales y específicas de tu agenda.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
                >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {isPending ? "Guardando..." : "Guardar Cambios"}
                </button>
            </div>

            {/* SECCIÓN 1: Duración Global */}
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
                    Duración Estándar del Turno
                </h2>
                <div className="max-w-xs">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Minutos por sesión
                    </label>
                    <select
                        value={formState.duration}
                        onChange={(e) => setFormState({ ...formState, duration: Number(e.target.value) })}
                        className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value={15}>15 Minutos</option>
                        <option value={30}>30 Minutos</option>
                        <option value={45}>45 Minutos</option>
                        <option value={60}>60 Minutos</option>
                        <option value={90}>90 Minutos</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-2">
                        Atención: Cambiar esto regenerará tu agenda futura basándose en el nuevo tamaño de bloque.
                    </p>
                </div>
            </section>

            {/* SECCIÓN 2: Reglas Globales (Fallback Default) */}
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
                    Política Semanal Global (Pacientes Regulares)
                </h2>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Modo de Restricción
                        </label>
                        <select
                            value={formState.defaultPolicy.mode}
                            onChange={(e) => setFormState({
                                ...formState,
                                defaultPolicy: { ...formState.defaultPolicy, mode: e.target.value as any }
                            })}
                            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="none">Libre (Sin límite)</option>
                            <option value="alert">Aviso Preventivo</option>
                            <option value="block">Bloqueo Estricto</option>
                        </select>
                    </div>

                    {formState.defaultPolicy.mode !== 'none' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Máximo turnos por semana
                            </label>
                            <input
                                type="number"
                                min={1}
                                value={formState.defaultPolicy.maxPerWeek || 1}
                                onChange={(e) => setFormState({
                                    ...formState,
                                    defaultPolicy: { ...formState.defaultPolicy, maxPerWeek: Number(e.target.value) }
                                })}
                                className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                    )}
                </div>
            </section>

            {/* SECCIÓN 3: Excepciones por Tipo de Paciente */}
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Excepciones (Overrides) por Tipo de Paciente
                    </h2>
                    <button
                        onClick={() => setIsAddingOverride(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium transition dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                        <Plus className="w-4 h-4" /> Agregar Excepción
                    </button>
                </div>

                {Object.keys(formState.overrides).length === 0 ? (
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                        No hay reglas específicas. Todos los pacientes usarán la política global.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(formState.overrides).map(([customType, overrideData]) => (
                            <div key={customType} className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                                {/* Badge Tipo */}
                                <div className="w-1/4">
                                    <span className="px-3 py-1 text-sm font-semibold text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900/30 dark:text-blue-300 uppercase tracking-wide">
                                        {customType}
                                    </span>
                                </div>

                                {/* Modo */}
                                <div className="w-2/4">
                                    <select
                                        value={overrideData.weeklyFrequencyPolicy.mode}
                                        onChange={(e) => updateOverridePolicy(customType, 'mode', e.target.value)}
                                        className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        <option value="none">Libre (Sin límite)</option>
                                        <option value="alert">Aviso Preventivo</option>
                                        <option value="block">Bloqueo Estricto</option>
                                    </select>
                                </div>

                                {/* Limite (solo si no es none) */}
                                <div className="w-1/4 flex gap-4 items-center justify-end">
                                    {overrideData.weeklyFrequencyPolicy.mode !== 'none' && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Límite:</span>
                                            <input
                                                type="number"
                                                min={1}
                                                value={overrideData.weeklyFrequencyPolicy.maxPerWeek || 1}
                                                onChange={(e) => updateOverridePolicy(customType, 'maxPerWeek', Number(e.target.value))}
                                                className="w-20 bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            />
                                        </div>
                                    )}

                                    {/* Boton Borrar */}
                                    <button
                                        onClick={() => removeOverride(customType)}
                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Modal de Agregar Excepción */}
            {isAddingOverride && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-sm w-full p-6 m-4 shadow-xl border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Nueva Excepción</h3>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Tipo de Paciente (ej: premium, intensivo)
                            </label>
                            <input
                                autoFocus
                                type="text"
                                value={customTypeInput}
                                onChange={(e) => setCustomTypeInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') confirmAddOverride();
                                    if (e.key === 'Escape') { setIsAddingOverride(false); setCustomTypeInput(''); }
                                }}
                                className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Ingresar tipo..."
                            />
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => { setIsAddingOverride(false); setCustomTypeInput(''); }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 focus:ring-4 focus:outline-none focus:ring-gray-200"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmAddOverride}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 transition-colors"
                            >
                                Agregar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
