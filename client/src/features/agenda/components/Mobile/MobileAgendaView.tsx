'use client';

import { useState, useMemo } from 'react';
import TurnoMobileCard from './TurnoMobileCard';
import TurnoActionSheet from './TurnoActionSheet';
import MobileMonthView from './MobileMonthView';
import { Plus, ChevronLeft, ChevronRight, CalendarDays, Calendar } from 'lucide-react';

interface MobileAgendaViewProps {
    appointments: any[];
    onNewTurno?: (date: Date) => void;
    onStatusChange?: (id: string, newStatus: string) => void;
    onCancel?: (id: string, source: 'PATIENT' | 'PROFESSIONAL' | 'SYSTEM', reason: string, mode?: 'single' | 'forward' | 'all') => void;
    onDelete?: (id: string, mode?: 'single' | 'forward' | 'all') => void;
}

// UTC helper: compare two dates by their UTC year/month/day
function isSameUTCDay(a: Date, b: Date): boolean {
    return a.getUTCFullYear() === b.getUTCFullYear()
        && a.getUTCMonth() === b.getUTCMonth()
        && a.getUTCDate() === b.getUTCDate();
}

type MobileView = 'day' | 'month';

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function MobileAgendaView({ appointments, onNewTurno, onStatusChange, onCancel, onDelete }: MobileAgendaViewProps) {
    const todayUTC = useMemo(() => {
        const now = new Date();
        return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    }, []);
    const [selectedDate, setSelectedDate] = useState(todayUTC);
    const [mobileView, setMobileView] = useState<MobileView>('day');
    const [actionSheetApp, setActionSheetApp] = useState<any>(null);

    // Generate current week dates for strip calendar (Mon-Fri only)
    const stripDates = useMemo(() => {
        const dayOfWeek = selectedDate.getUTCDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), selectedDate.getUTCDate() + diffToMonday));
        return Array.from({ length: 5 }).map((_, i) => {
            const d = new Date(monday);
            d.setUTCDate(monday.getUTCDate() + i);
            return d;
        });
    }, [selectedDate]);

    // Filter appointments for selected date (UTC comparison)
    const dayAppointments = useMemo(() => {
        return appointments.filter(a => isSameUTCDay(new Date(a.startTime), selectedDate))
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }, [appointments, selectedDate]);

    // Generate timeline slots using UTC hours (08:00 to 18:00)
    const timelineSlots = useMemo(() => {
        const slots = [];
        for (let i = 8; i <= 18; i++) {
            const slotTime = new Date(Date.UTC(
                selectedDate.getUTCFullYear(),
                selectedDate.getUTCMonth(),
                selectedDate.getUTCDate(),
                i, 0, 0, 0
            ));

            const slotApps = dayAppointments.filter(a => {
                const startHour = new Date(a.startTime).getUTCHours();
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

    const monthLabel = `${MONTH_NAMES[selectedDate.getUTCMonth()]} ${selectedDate.getUTCFullYear()}`;

    const navigateMonth = (direction: number) => {
        const d = new Date(Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth() + direction, 1));
        setSelectedDate(d);
    };

    const navigateWeek = (direction: number) => {
        const d = new Date(selectedDate);
        d.setUTCDate(d.getUTCDate() + (direction * 7));
        setSelectedDate(d);
    };

    const handleMonthDaySelect = (date: Date) => {
        setSelectedDate(date);
        setMobileView('day'); // Switch to day view on day tap
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 pb-20">
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 pt-4 pb-3 px-4 sticky top-0 z-20 shadow-sm">
                {/* Title row with view toggle */}
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Mi Agenda
                    </h2>
                    {/* View Toggle */}
                    <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5">
                        <button
                            onClick={() => setMobileView('day')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                mobileView === 'day'
                                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400'
                            }`}
                        >
                            <CalendarDays size={14} />
                            Día
                        </button>
                        <button
                            onClick={() => setMobileView('month')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                mobileView === 'month'
                                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400'
                            }`}
                        >
                            <Calendar size={14} />
                            Mes
                        </button>
                    </div>
                </div>

                {/* Navigation + date label */}
                <div className="flex items-center justify-between mb-3">
                    <button
                        onClick={() => mobileView === 'month' ? navigateMonth(-1) : navigateWeek(-1)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={() => setSelectedDate(todayUTC)}
                        className="text-sm font-semibold text-gray-700 dark:text-gray-300 capitalize hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                        {monthLabel}
                    </button>
                    <button
                        onClick={() => mobileView === 'month' ? navigateMonth(1) : navigateWeek(1)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Strip Calendar (Day view only) */}
                {mobileView === 'day' && (
                    <div className="flex justify-between items-center gap-2 overflow-x-auto snap-x hide-scrollbar pb-1">
                        {stripDates.map((date, idx) => {
                            const isSelected = isSameUTCDay(date, selectedDate);
                            const isToday = isSameUTCDay(date, todayUTC);
                            const dayName = new Intl.DateTimeFormat('es-AR', { weekday: 'short', timeZone: 'UTC' }).format(date);
                            const dayNum = date.getUTCDate();
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
                                        {dayName}
                                    </span>
                                    <span className={`text-lg font-bold ${isToday && !isSelected ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
                                        {dayNum}
                                    </span>
                                    {isToday && <div className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-indigo-600'}`} />}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Body */}
            {mobileView === 'month' ? (
                <div className="flex-1 overflow-y-auto">
                    <MobileMonthView
                        appointments={appointments}
                        selectedDate={selectedDate}
                        onSelectDate={handleMonthDaySelect}
                    />
                </div>
            ) : (
                /* Day Timeline Body */
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
                                <div className="absolute top-2 -left-1 w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-800" />

                                {slot.appointments.length > 0 ? (
                                    <div className="space-y-4">
                                        {slot.appointments.map(app => (
                                            <div key={app._id || app.appointmentId} className="-mt-1">
                                                <TurnoMobileCard
                                                    appointment={app}
                                                    onStatusChange={onStatusChange}
                                                    onClick={() => setActionSheetApp(app)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
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
            )}

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
