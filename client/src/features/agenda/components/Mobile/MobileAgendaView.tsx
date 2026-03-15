'use client';

import { useState, useMemo } from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import TurnoMobileCard from './TurnoMobileCard';
import TurnoActionSheet from './TurnoActionSheet';
import { Plus } from 'lucide-react';

interface MobileAgendaViewProps {
    appointments: any[];
    onNewTurno?: (date: Date) => void;
    onStatusChange?: (id: string, newStatus: string) => void;
    onCancel?: (id: string, source: 'PATIENT' | 'PROFESSIONAL' | 'SYSTEM', reason: string, mode?: 'single' | 'forward' | 'all') => void;
    onDelete?: (id: string, mode?: 'single' | 'forward' | 'all') => void;
}

export default function MobileAgendaView({ appointments, onNewTurno, onStatusChange, onCancel, onDelete }: MobileAgendaViewProps) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [actionSheetApp, setActionSheetApp] = useState<any>(null);

    // Generate current week dates for strip calendar
    const stripDates = useMemo(() => {
        const start = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
        return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
    }, [selectedDate]);

    // Filter appointments for selected date
    const dayAppointments = useMemo(() => {
        return appointments.filter(a => isSameDay(new Date(a.startTime), selectedDate))
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }, [appointments, selectedDate]);

    // Generate timeline slots (e.g. 08:00 to 18:00 every hour)
    const timelineSlots = useMemo(() => {
        const slots = [];
        for (let i = 8; i <= 18; i++) {
            const slotTime = new Date(selectedDate);
            slotTime.setHours(i, 0, 0, 0);

            // Find appointments that fall within this hour
            const slotApps = dayAppointments.filter(a => {
                const startHour = new Date(a.startTime).getHours();
                return startHour === i;
            });

            slots.push({
                hour: i,
                timeLabel: `${i.toString().padStart(2, '0')}:00`,
                dateObj: slotTime,
                appointments: slotApps
            });
        }
        return slots;
    }, [selectedDate, dayAppointments]);

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 pb-20">
            {/* Header / Week Strip */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 pt-4 pb-3 px-4 sticky top-0 z-20 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Mi Agenda
                    </h2>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
                        {format(selectedDate, 'MMMM yyyy', { locale: es })}
                    </span>
                </div>

                {/* Strip Calendar */}
                <div className="flex justify-between items-center gap-2 overflow-x-auto snap-x hide-scrollbar pb-1">
                    {stripDates.map((date, idx) => {
                        const isSelected = isSameDay(date, selectedDate);
                        const isToday = isSameDay(date, new Date());
                        return (
                            <button
                                key={idx}
                                onClick={() => setSelectedDate(date)}
                                className={`flex flex-col items-center justify-center min-w-[3rem] p-2 rounded-2xl snap-center transition-all ${isSelected
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-105'
                                    : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <span className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${isSelected ? 'text-indigo-100' : 'text-gray-400'}`}>
                                    {format(date, 'eee', { locale: es })}
                                </span>
                                <span className={`text-lg font-bold ${isToday && !isSelected ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
                                    {format(date, 'd')}
                                </span>
                                {isToday && <div className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-indigo-600'}`} />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Timeline Body */}
            <div className="flex-1 px-4 py-6 space-y-6">
                {timelineSlots.map((slot) => (
                    <div key={slot.hour} className="flex gap-4 relative">
                        {/* Time Column */}
                        <div className="w-12 flex-shrink-0 text-right">
                            <span className="text-xs font-bold text-gray-400 dark:text-gray-600 sticky top-24">
                                {slot.timeLabel}
                            </span>
                        </div>

                        {/* Content Column */}
                        <div className="flex-1 relative pb-6 border-l-2 border-dashed border-gray-200 dark:border-gray-800 focus-within:border-indigo-200 dark:focus-within:border-indigo-900/50 pl-4 min-h-[4rem]">
                            {/* Horizontal Line Indicator */}
                            <div className="absolute top-2 -left-1 w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-800" />

                            {slot.appointments.length > 0 ? (
                                <div className="space-y-4">
                                    {slot.appointments.map(app => (
                                        <div key={app._id} className="-mt-1">
                                            <TurnoMobileCard
                                                appointment={app}
                                                onStatusChange={onStatusChange}
                                                onClick={() => setActionSheetApp(app)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                /* Free Slot Tappable Area */
                                <button
                                    onClick={() => onNewTurno?.(slot.dateObj)}
                                    className="w-full -mt-1 h-full min-h-[3.5rem] flex items-center gap-2 pl-4 rounded-xl border border-dashed border-transparent hover:border-indigo-300 dark:hover:border-indigo-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group cursor-pointer"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 flex items-center justify-center transition-colors">
                                        <Plus size={16} />
                                    </div>
                                    <span className="text-sm font-medium">Disponible</span>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {/* Action Sheet for selected turno */}
            <TurnoActionSheet
                open={!!actionSheetApp}
                onOpenChange={(open) => { if (!open) setActionSheetApp(null); }}
                appointment={actionSheetApp}
                onMarkCompleted={(id) => onStatusChange?.(id, 'completed')}
                onReschedule={(id) => onStatusChange?.(id, 'pending')}
                onCancel={onCancel}
                onDelete={onDelete}
            />
        </div>
    );
}
