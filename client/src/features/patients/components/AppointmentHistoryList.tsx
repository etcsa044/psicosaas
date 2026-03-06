'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Calendar as CalendarIcon, Loader2, Video, MapPin, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
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

interface AppointmentHistoryListProps {
    patientId: string;
}

export default function AppointmentHistoryList({ patientId }: AppointmentHistoryListProps) {
    const { data, isLoading, isError } = useQuery<{ data: AppointmentHistory[] }>({
        queryKey: ['patients', patientId, 'history'],
        queryFn: async () => {
            const { data } = await api.get(`/patients/${patientId}/appointment-history`);
            return data.data; // unwraps { status, data: { data, pagination } }
        },
        enabled: !!patientId,
    });

    const appointments = data?.data || [];

    // Sort logic
    const sortedAppointments = [...appointments].sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());

    // Split into upcoming and past
    const now = new Date();
    const upcoming = sortedAppointments.filter(app => new Date(app.endAt) > now).reverse(); // closest first
    const past = sortedAppointments.filter(app => new Date(app.endAt) <= now);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <p className="text-red-500 text-sm">Error cargando el historial clínico.</p>
            </div>
        );
    }

    if (appointments.length === 0) {
        return (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="w-14 h-14 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">Sin turnos registrados</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Este paciente aún no tiene histórico de citas en el sistema.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            {upcoming.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-5 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        Próximas Sesiones
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {upcoming.map(app => (
                            <AppointmentCard key={app._id} appointment={app} />
                        ))}
                    </div>
                </div>
            )}

            {past.length > 0 && (
                <div className={upcoming.length > 0 ? "pt-8 border-t border-gray-100 dark:border-gray-700" : ""}>
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-6 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                        Historial Clínico (Pasado)
                    </h4>
                    <div className="relative border-l-2 border-gray-100 dark:border-gray-700 ml-4 space-y-8">
                        {past.map(app => (
                            <AppointmentCard key={app._id} appointment={app} isTimeline />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function AppointmentCard({ appointment, isTimeline = false }: { appointment: AppointmentHistory, isTimeline?: boolean }) {
    const isCancelled = appointment.isCancelled || appointment.status === 'cancelled';
    const isCompleted = appointment.status === 'completed';
    const date = new Date(appointment.startAt);

    return (
        <div className={`relative ${isTimeline ? 'ml-8' : ''}`}>
            {isTimeline && (
                <div className={`absolute -left-[41px] top-6 w-4 h-4 rounded-full border-[3px] border-white dark:border-gray-800 shadow-sm ${isCancelled ? 'bg-red-400' : isCompleted ? 'bg-green-400' : 'bg-gray-300 dark:bg-gray-600'
                    }`} />
            )}

            <div className={`p-5 rounded-xl border transition-shadow hover:shadow-md ${isCancelled ? 'bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-900/50' :
                    isCompleted ? 'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700' :
                        'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 shadow-sm'
                }`}>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                    <div className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100 capitalize">
                        {format(date, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 px-2.5 py-1 rounded-md border border-gray-100 dark:border-gray-700 w-fit">
                        <CalendarIcon size={14} />
                        {format(date, "HH:mm")} - {format(new Date(appointment.endAt), "HH:mm")}
                    </div>
                </div>

                <div className="flex items-center justify-between mt-4 items-end">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 px-2.5 py-1 rounded-md border border-gray-100 dark:border-gray-700">
                        {appointment.modality === 'online' ? (
                            <><Video size={16} className="text-blue-500" /> videollamada</>
                        ) : (
                            <><MapPin size={16} className="text-emerald-500" /> presencial</>
                        )}
                    </div>

                    {isCancelled ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                            <AlertCircle size={14} /> Cancelado
                        </span>
                    ) : (
                        <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${isCompleted ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                            }`}>
                            {isCompleted ? 'Completado' : 'Asignado'}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
