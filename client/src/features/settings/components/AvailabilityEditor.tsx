import React, { useState, useEffect } from 'react';
import { useAvailabilityPatterns, useUpdateAvailabilityPatterns, AvailabilityPattern } from '../hooks/useAvailability';
import { Loader2, Plus, Trash2, Save, CalendarOff } from 'lucide-react';
import toast from 'react-hot-toast';
import ExceptionEditor from './ExceptionEditor';

const DAYS_OF_WEEK = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
    { value: 0, label: 'Domingo' },
];

function minsToTime(mins: number) {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
}

function timeToMins(time: string) {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
}

export default function AvailabilityEditor() {
    const { data: patterns = [], isLoading } = useAvailabilityPatterns();
    const { mutateAsync: updatePatterns, isPending: isUpdating } = useUpdateAvailabilityPatterns();

    // Local state to edit before saving
    const [localPatterns, setLocalPatterns] = useState<AvailabilityPattern[]>([]);

    useEffect(() => {
        if (patterns) {
            setLocalPatterns(patterns);
        }
    }, [patterns]);

    const handleAddSlot = (dayOfWeek: number) => {
        setLocalPatterns(prev => [
            ...prev,
            { dayOfWeek, startMinutes: 540, endMinutes: 1080, slotDuration: 45, bufferMinutes: 0 }
        ]);
    };

    const handleRemoveSlot = (index: number) => {
        setLocalPatterns(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpdateSlot = (index: number, field: keyof AvailabilityPattern, value: any) => {
        setLocalPatterns(prev => {
            const copy = [...prev];
            copy[index] = { ...copy[index], [field]: value };
            return copy;
        });
    };

    const handleSavePatterns = async () => {
        try {
            await updatePatterns(localPatterns);
            toast.success('Horarios regulares guardados correctamente');
        } catch (error) {
            toast.error('Error al guardar horarios');
            console.error(error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Horarios Regulares */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            ⏱️ Horarios Regulares
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configurá tu disponibilidad base semanal.</p>
                    </div>
                    <button
                        onClick={handleSavePatterns}
                        disabled={isUpdating}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                    >
                        {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Guardar Horarios
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {DAYS_OF_WEEK.map(day => {
                        const dayPatterns = localPatterns.map((p, i) => ({ ...p, originalIndex: i })).filter(p => p.dayOfWeek === day.value);
                        
                        return (
                            <div key={day.value} className="flex flex-col sm:flex-row gap-4 py-3 border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                                <div className="sm:w-32 flex-shrink-0 flex items-center justify-between sm:justify-start">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{day.label}</span>
                                    <button
                                        onClick={() => handleAddSlot(day.value)}
                                        className="p-1 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded ml-2"
                                        title="Añadir franja horaria"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                                <div className="flex-1 space-y-2">
                                    {dayPatterns.length === 0 ? (
                                        <span className="text-sm text-gray-400 italic">No disponible</span>
                                    ) : (
                                        dayPatterns.map(p => (
                                            <div key={p.originalIndex} className="flex flex-wrap items-center gap-3">
                                                <input
                                                    type="time"
                                                    value={minsToTime(p.startMinutes)}
                                                    onChange={(e) => handleUpdateSlot(p.originalIndex, 'startMinutes', timeToMins(e.target.value))}
                                                    className="border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 px-2 py-1 text-sm focus:ring-1 focus:ring-indigo-500 dark:text-white"
                                                />
                                                <span className="text-gray-400">a</span>
                                                <input
                                                    type="time"
                                                    value={minsToTime(p.endMinutes)}
                                                    onChange={(e) => handleUpdateSlot(p.originalIndex, 'endMinutes', timeToMins(e.target.value))}
                                                    className="border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 px-2 py-1 text-sm focus:ring-1 focus:ring-indigo-500 dark:text-white"
                                                />
                                                <button
                                                    onClick={() => handleRemoveSlot(p.originalIndex)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Excepciones */}
            <ExceptionEditor />
        </div>
    );
}
