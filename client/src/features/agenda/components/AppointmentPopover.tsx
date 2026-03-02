import { Slot } from '../types/agenda.types';
import { X, CalendarX, AlertCircle } from 'lucide-react';
import { useDeleteAppointment } from '../hooks/useDeleteAppointment';
import { useState } from 'react';

interface AppointmentPopoverProps {
    slot: Slot;
    onClose: () => void;
}

export function AppointmentPopover({ slot, onClose }: AppointmentPopoverProps) {
    const { mutateAsync: deleteAppointment, isPending } = useDeleteAppointment();
    const [isConfirming, setIsConfirming] = useState(false);

    if (!slot.appointmentId) return null;

    const startHour = new Date(slot.startAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
    const endHour = new Date(slot.endAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });

    const handleDeleteConfirm = async () => {
        try {
            await deleteAppointment(slot.appointmentId!);
            onClose(); // Defer close until promise resolves completely to ensure cache invalidation runs
        } catch (error: any) {
            console.error("❌ Error eliminando turno:", error);
            const errorMsg = error.response?.data?.message || 'Error desconocido';
            alert(`Hubo un problema al eliminar el turno: ${errorMsg}`);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-auto" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-800 rounded-xl max-w-sm w-full p-6 shadow-xl border border-gray-100 dark:border-gray-700"
                onClick={e => e.stopPropagation()} // stop clicks from closing modal
            >
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Detalle del Turno</h3>
                    <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4 mb-6">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Paciente</p>
                        <p className="text-base font-medium text-gray-900 dark:text-white">{slot.patientName || 'Desconocido'}</p>
                        {slot.patientType && (
                            <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200">
                                {slot.patientType}
                            </span>
                        )}
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Horario</p>
                        <p className="text-base font-medium text-gray-900 dark:text-white">{startHour} - {endHour}</p>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2 mb-2">
                        <AlertCircle className="text-amber-500 w-5 h-5 flex-shrink-0" />
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                            Para <span className="font-semibold">reprogramar</span>, simplemente arrastrá el turno desde el calendario a otro horario disponible.
                        </p>
                    </div>

                    {isConfirming ? (
                        <div className="flex flex-col gap-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-lg">
                            <p className="text-sm text-red-800 dark:text-red-300 font-medium text-center mb-1">
                                ¿Estás seguro de eliminar este turno?
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsConfirming(false)}
                                    disabled={isPending}
                                    className="flex-1 px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    disabled={isPending}
                                    className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition flex items-center justify-center gap-1 disabled:opacity-50"
                                >
                                    {isPending ? 'Eliminando...' : 'Sí, eliminar'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsConfirming(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium rounded-lg transition-colors"
                        >
                            <CalendarX size={18} />
                            Eliminar Turno
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
