'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { X, Calendar as CalendarIcon, Loader2, Video, MapPin, AlertCircle } from 'lucide-react';
import { format, isFuture } from 'date-fns';
import { es } from 'date-fns/locale';

interface AppointmentHistory {
    _id: string;
    title: string;
    startAt: string;
    endAt: string;
    status: string;
    modality: 'online' | 'in-person';
    isCancelled: boolean;
    cancellationReason?: string;
}

interface PatientHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    patientName: string;
}

export default function PatientHistoryModal({ isOpen, onClose, patientId, patientName }: PatientHistoryModalProps) {
    const { data, isLoading, isError } = useQuery<{ data: AppointmentHistory[] }>({
        queryKey: ['patients', patientId, 'history'],
        queryFn: async () => {
            const { data } = await api.get(`/patients/${patientId}/appointment-history`);
            return data;
        },
        enabled: isOpen && !!patientId,
    });

    if (!isOpen) return null;

    const appointments = data?.data || [];

    // Sort logic (if not already sorted by backend, usually we want newest first)
    const sortedAppointments = [...appointments].sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());

    // Split into upcoming and past
    const now = new Date();
    const upcoming = sortedAppointments.filter(app => new Date(app.endAt) > now).reverse(); // closest first
    const past = sortedAppointments.filter(app => new Date(app.endAt) <= now);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
            <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={onClose} />

            <div className="relative bg-white dark:bg-gray-900 w-full max-w-md h-full shadow-2xl flex flex-col border-l border-gray-200 dark:border-gray-800 animate-slide-in-right">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate" title={patientName}>
                            Historial
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[300px]">{patientName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading && (
                        <div className="flex justify-center items-center h-32">
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                        </div>
                    )}

                    {isError && (
                        <div className="text-center py-8 text-red-500 text-sm">
                            Error cargando el historial.
                        </div>
                    )}

                    {!isLoading && !isError && appointments.length === 0 && (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                <CalendarIcon className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Este paciente aún no tiene turnos registrados</p>
                        </div>
                    )}

                    {!isLoading && appointments.length > 0 && (
                        <div className="space-y-8">
                            {upcoming.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                        Próximos turnos
                                    </h4>
                                    <div className="space-y-3">
                                        {upcoming.map(app => (
                                            <AppointmentCard key={app._id} appointment={app} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {past.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                        Historial pasado
                                    </h4>
                                    <div className="relative border-l-2 border-gray-100 dark:border-gray-800 ml-3 space-y-6">
                                        {past.map(app => (
                                            <AppointmentCard key={app._id} appointment={app} isTimeline />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function AppointmentCard({ appointment, isTimeline = false }: { appointment: AppointmentHistory, isTimeline?: boolean }) {
    const isCancelled = appointment.isCancelled || appointment.status === 'cancelled';
    const isCompleted = appointment.status === 'completed';
    const date = new Date(appointment.startAt);

    return (
        <div className={`relative ${isTimeline ? 'ml-6' : ''}`}>
            {isTimeline && (
                <div className={`absolute -left-[31px] top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${isCancelled ? 'bg-red-400' : isCompleted ? 'bg-green-400' : 'bg-gray-300 dark:bg-gray-600'
                    }`} />
            )}

            <div className={`p-4 rounded-xl border ${isCancelled ? 'bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-900/50' :
                    isCompleted ? 'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700' :
                        'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 shadow-sm'
                }`}>
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">
                        {format(date, "EEEE d 'de' MMMM", { locale: es })}
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                        {format(date, "HH:mm")} - {format(new Date(appointment.endAt), "HH:mm")}
                    </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        {appointment.modality === 'online' ? (
                            <><Video size={14} className="text-blue-500" /> Online</>
                        ) : (
                            <><MapPin size={14} className="text-emerald-500" /> Presencial</>
                        )}
                    </div>

                    {isCancelled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                            <AlertCircle size={10} /> Cancelado
                        </span>
                    ) : (
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isCompleted ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                            }`}>
                            {isCompleted ? 'Completado' : 'Confirmado'}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
