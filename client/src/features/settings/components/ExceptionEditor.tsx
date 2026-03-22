import React, { useState } from 'react';
import { useAvailabilityExceptions, useSetAvailabilityException, useDeleteAvailabilityException } from '../hooks/useAvailability';
import { CalendarOff, Plus, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExceptionEditor() {
    const { data: exceptions = [], isLoading } = useAvailabilityExceptions();
    const { mutateAsync: addException, isPending: isAdding } = useSetAvailabilityException();
    const { mutateAsync: removeException, isPending: isRemoving } = useDeleteAvailabilityException();

    const [selectedDate, setSelectedDate] = useState('');

    const handleBlockDate = async () => {
        if (!selectedDate) {
            toast.error('Seleccioná una fecha');
            return;
        }

        try {
            await addException({
                date: new Date(selectedDate).toISOString(),
                blocked: true,
                reason: 'Bloqueado por el profesional'
            });
            setSelectedDate('');
            toast.success('Día bloqueado correctamente');
        } catch (error) {
            toast.error('Error al bloquear el día');
            console.error(error);
        }
    };

    const handleRemoveException = async (id: string) => {
        try {
            await removeException(id);
            toast.success('Día desbloqueado');
        } catch (error) {
            toast.error('Error al desbloquear el día');
            console.error(error);
        }
    };

    const futureExceptions = exceptions.filter(e => new Date(e.date) >= new Date(new Date().setHours(0,0,0,0)));

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <CalendarOff size={20} className="text-red-500" />
                    Días Bloqueados (Excepciones)
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Bloqueá fechas específicas por vacaciones, feriados o imprevistos.</p>
            </div>

            <div className="p-6">
                <div className="flex flex-wrap items-end gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nueva fecha a bloquear</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full sm:w-auto rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-800 dark:text-white"
                        />
                    </div>
                    <button
                        onClick={handleBlockDate}
                        disabled={!selectedDate || isAdding}
                        className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                    >
                        {isAdding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        Bloquear Día
                    </button>
                </div>

                <div className="space-y-3">
                    {isLoading ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin text-gray-400" /></div>
                    ) : futureExceptions.length === 0 ? (
                        <div className="text-center p-6 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                            <p className="text-sm text-gray-500 dark:text-gray-400">No hay días bloqueados próximamente.</p>
                        </div>
                    ) : (
                        futureExceptions.map(exc => (
                            <div key={exc._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {new Date(exc.date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}
                                </span>
                                <button
                                    onClick={() => handleRemoveException(exc._id)}
                                    disabled={isRemoving}
                                    className="p-1.5 text-red-500 hover:bg-white dark:hover:bg-gray-700 rounded transition-colors"
                                    title="Desbloquear"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
