'use client';

import { Drawer } from 'vaul';
import { CheckCircle, CalendarClock, XCircle, Trash2, X } from 'lucide-react';
import { useState } from 'react';

const CANCEL_REASONS = [
    { value: 'patient_notice', label: 'Paciente avisó', source: 'PATIENT' as const },
    { value: 'professional', label: 'Problema del profesional', source: 'PROFESSIONAL' as const },
    { value: 'no_show', label: 'No asistió', source: 'PATIENT' as const },
    { value: 'rescheduled', label: 'Reprogramado', source: 'SYSTEM' as const },
];

interface TurnoActionSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointment: any;
    onMarkCompleted?: (id: string) => void;
    onReschedule?: (id: string) => void;
    onCancel?: (id: string, source: 'PATIENT' | 'PROFESSIONAL' | 'SYSTEM', reason: string) => void;
    onDelete?: (id: string) => void;
}

export default function TurnoActionSheet({
    open,
    onOpenChange,
    appointment,
    onMarkCompleted,
    onReschedule,
    onCancel,
    onDelete,
}: TurnoActionSheetProps) {
    const [showCancelReasons, setShowCancelReasons] = useState(false);

    const handleClose = () => {
        setShowCancelReasons(false);
        onOpenChange(false);
    };

    const handleCancelWithReason = (reason: typeof CANCEL_REASONS[0]) => {
        onCancel?.(appointment?._id || appointment?.appointmentId, reason.source, reason.label);
        handleClose();
    };

    if (!appointment) return null;

    return (
        <Drawer.Root open={open} onOpenChange={(o) => { if (!o) handleClose(); else onOpenChange(o); }}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/50 z-40" />
                <Drawer.Content className="bg-white dark:bg-gray-900 rounded-t-3xl fixed bottom-0 left-0 right-0 z-50 outline-none">
                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-700 my-3" />

                    <div className="px-5 pb-8 max-h-[60vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {appointment.patientName || 'Paciente'}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(appointment.startTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                    {' — '}
                                    {new Date(appointment.endTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            <button onClick={handleClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>

                        {!showCancelReasons ? (
                            /* Main actions */
                            <div className="space-y-2">
                                <button
                                    onClick={() => { onMarkCompleted?.(appointment._id || appointment.appointmentId); handleClose(); }}
                                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                        <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-900 dark:text-white">Marcar como Atendido</span>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Registrar que la sesión se completó</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => { onReschedule?.(appointment._id || appointment.appointmentId); handleClose(); }}
                                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                        <CalendarClock size={20} className="text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-900 dark:text-white">Reprogramar</span>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Mover a otro horario o día</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setShowCancelReasons(true)}
                                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                        <XCircle size={20} className="text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-900 dark:text-white">Cancelar Turno</span>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Cancelar con motivo específico</p>
                                    </div>
                                </button>

                                <div className="border-t border-gray-100 dark:border-gray-800 my-2" />

                                <button
                                    onClick={() => { onDelete?.(appointment._id || appointment.appointmentId); handleClose(); }}
                                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                        <Trash2 size={20} className="text-red-600 dark:text-red-400" />
                                    </div>
                                    <div>
                                        <span className="font-medium text-red-600 dark:text-red-400">Eliminar Turno</span>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Eliminación administrativa permanente</p>
                                    </div>
                                </button>
                            </div>
                        ) : (
                            /* Cancel reasons sub-menu */
                            <div className="space-y-2">
                                <button onClick={() => setShowCancelReasons(false)} className="text-sm text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1">
                                    ← Volver
                                </button>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">¿Cuál es el motivo?</h4>
                                {CANCEL_REASONS.map((reason) => (
                                    <button
                                        key={reason.value}
                                        onClick={() => handleCancelWithReason(reason)}
                                        className="w-full text-left px-4 py-3.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-800"
                                    >
                                        <span className="font-medium text-gray-900 dark:text-white">{reason.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
