'use client';

import { CalendarClock, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TurnoMobileCardProps {
    appointment: any;
    onStatusChange?: (id: string, newStatus: string) => void;
    onClick?: () => void;
}

export default function TurnoMobileCard({ appointment, onStatusChange, onClick }: TurnoMobileCardProps) {
    // Determine visual status styles
    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'completed':
                return { light: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-900/50', icon: '🟢', label: 'Atendido' };
            case 'pending':
                return { light: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-900/50', icon: '🟡', label: 'Pendiente' };
            case 'cancelled':
                return { light: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-900/50', icon: '🔴', label: 'Cancelado' };
            default:
                return { light: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-900/50', icon: '🔵', label: 'Confirmado' };
        }
    };

    const s = getStatusStyles(appointment.status);
    const startObj = new Date(appointment.startTime);

    return (
        <div className="relative w-full mb-3 rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm transition-shadow active:scale-[0.98]">
            {/* Main Card Content */}
            <div
                onClick={onClick}
                className="p-4 flex flex-col gap-2 relative z-10 bg-white dark:bg-gray-900"
            >
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                            {format(startObj, 'HH:mm')}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${s.light}`}>
                            {s.icon} {s.label}
                        </span>
                    </div>
                    {/* Duration badge or similar */}
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-1 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md">
                        <Clock size={12} />
                        {(new Date(appointment.endTime).getTime() - startObj.getTime()) / 60000} min
                    </div>
                </div>

                <div className="mt-1">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-1">
                        {appointment.patientName || 'Paciente Activo'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                        {appointment.appointmentType || 'Primera sesión'}
                    </p>
                </div>

                {/* Quick actions row (always visible instead of swipe for reliability) */}
                <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-800 flex justify-between">
                    <button
                        onClick={(e) => { e.stopPropagation(); onStatusChange?.(appointment._id, 'completed'); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm font-medium text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                    >
                        <CheckCircle size={16} /> Atendido
                    </button>
                    <div className="w-px bg-gray-100 dark:bg-gray-800 mx-2" />
                    <button
                        onClick={(e) => { e.stopPropagation(); onStatusChange?.(appointment._id, 'pending'); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm font-medium text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                    >
                        <CalendarClock size={16} /> Reprogramar
                    </button>
                </div>
            </div>

            {/* Color stripe on the left edge */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${s.light.split(' ')[0]}`} />
        </div>
    );
}
