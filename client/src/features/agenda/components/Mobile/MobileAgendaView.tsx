'use client';

import { useState, useMemo } from 'react';
import { useAgendaUIStore } from '../../stores/agendaUIStore';
import TurnoMobileCard from './TurnoMobileCard';
import TurnoActionSheet from './TurnoActionSheet';
import MobileMonthView from './MobileMonthView';
import { Plus, ChevronLeft, ChevronRight, CalendarDays, Calendar } from 'lucide-react';

interface SlotData {
    startAt: string;
    endAt: string;
    status: 'available' | 'occupied' | 'blocked';
    appointmentId?: string;
    patientName?: string;
    patientType?: string;
    isRecurring?: boolean;
}

interface DayData {
    date: string;
    slots: SlotData[];
}

interface MobileAgendaViewProps {
    /** Full backend days with ALL slots (available + occupied) */
    days: DayData[];
    onNewTurno?: (slot: { startAt: string; endAt: string; status: 'available' }) => void;
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

type MobileView = 'day' | 'week' | 'month';

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function MobileAgendaView({ days, onNewTurno, onStatusChange, onCancel, onDelete }: MobileAgendaViewProps) {
    const { currentDate, viewMode: storeViewMode, setViewMode: storeSetViewMode, setDate } = useAgendaUIStore();
    
    const todayUTC = useMemo(() => {
        const now = new Date();
        return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    }, []);
    
    // Wire local selectedDate and view mode to the global store
    const selectedDate = useMemo(() => new Date(currentDate), [currentDate]);
    const setSelectedDate = (d: Date) => setDate(d.toISOString());
    const mobileView = storeViewMode;
    const setMobileView = (mode: MobileView) => storeSetViewMode(mode);

    const [actionSheetApp, setActionSheetApp] = useState<any>(null);
    const [rescheduleTargetApp, setRescheduleTargetApp] = useState<any>(null);

    const stripDates = useMemo(() => {
        const dayOfWeek = selectedDate.getUTCDay();
        // If Sunday, show the upcoming week instead of the past week
        const diffToMonday = dayOfWeek === 0 ? 1 : 1 - dayOfWeek;
        const monday = new Date(Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), selectedDate.getUTCDate() + diffToMonday));
        return Array.from({ length: 5 }).map((_, i) => {
            const d = new Date(monday);
            d.setUTCDate(monday.getUTCDate() + i);
            return d;
        });
    }, [selectedDate]);

    // Find the backend day matching the selected date — use real slots from the backend
    const selectedDaySlots = useMemo(() => {
        const matchingDay = days.find(d => {
            const dayDate = new Date(d.date);
            return isSameUTCDay(dayDate, selectedDate);
        });
        return matchingDay?.slots || [];
    }, [days, selectedDate]);

    // Flatten all occupied appointments for the month view
    const allAppointments = useMemo(() => {
        return days.flatMap(d => d.slots.filter(s => s.status === 'occupied').map(s => ({
            ...s,
            startTime: s.startAt,
            endTime: s.endAt,
            patientName: s.patientName || 'Paciente',
        })));
    }, [days]);

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
        setMobileView('day');
    };

    const handleSlotClick = (slot: any) => {
        if (rescheduleTargetApp) {
            // Initiate reschedule
            onNewTurno?.({ ...slot, isReschedule: true, originalApp: rescheduleTargetApp } as any);
            setRescheduleTargetApp(null);
        } else {
            // Normal create
            onNewTurno?.(slot);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 pb-20 relative">
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 pt-4 pb-3 px-4 sticky top-0 z-20 shadow-sm">
                {/* Title row with view toggle */}
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Mi Agenda
                    </h2>
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
                            onClick={() => setMobileView('week')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                mobileView === 'week'
                                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400'
                            }`}
                        >
                            <CalendarDays size={14} />
                            Semana
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
                        {mobileView === 'week' ? `Semana ${selectedDate.getUTCDate()} ${monthLabel}` : monthLabel}
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

            {/* Reschedule Banner */}
            {rescheduleTargetApp && (
                <div className="bg-amber-100 dark:bg-amber-900/60 p-3 flex items-center justify-between sticky z-10 top-[140px] shadow-sm border-b border-amber-200 dark:border-amber-800">
                    <div>
                        <p className="text-sm font-bold text-amber-900 dark:text-amber-100">Modo Reprogramación</p>
                        <p className="text-xs text-amber-800 dark:text-amber-300">Tocá un horario para mover el turno de {rescheduleTargetApp.patientName}</p>
                    </div>
                    <button 
                        onClick={() => setRescheduleTargetApp(null)}
                        className="px-3 py-1 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 rounded-lg text-xs font-bold"
                    >
                        Cancelar
                    </button>
                </div>
            )}

            {/* Body */}
            {mobileView === 'month' ? (
                <div className="flex-1 overflow-y-auto">
                    <MobileMonthView
                        appointments={allAppointments}
                        selectedDate={selectedDate}
                        onSelectDate={handleMonthDaySelect}
                    />
                </div>
            ) : mobileView === 'week' ? (
                /* Week Timeline Body */
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
                    {stripDates.map((weekDate, dateIdx) => {
                        const dayISO = weekDate.toISOString().split('T')[0];
                        const matchingDay = days.find(d => d.date.startsWith(dayISO));
                        const daySlots = matchingDay?.slots || [];
                        const dayName = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', timeZone: 'UTC' }).format(weekDate);
                        
                        return (
                            <div key={dateIdx} className="space-y-4">
                                <h3 className="font-bold text-gray-900 dark:text-white capitalize sticky top-0 bg-gray-50 dark:bg-gray-950 py-2 z-10 border-b border-gray-200 dark:border-gray-800">
                                    {dayName}
                                </h3>
                                
                                {daySlots.length === 0 ? (
                                    <div className="text-center py-4 text-gray-400 text-sm">Sin horarios para este día</div>
                                ) : (
                                    daySlots.map((slot, idx) => {
                                        const startTime = new Date(slot.startAt);
                                        const timeLabel = `${startTime.getUTCHours().toString().padStart(2, '0')}:${startTime.getUTCMinutes().toString().padStart(2, '0')}`;
                                        
                                        return (
                                            <div key={idx} className="flex gap-4 relative">
                                                <div className="w-12 flex-shrink-0 text-right">
                                                    <span className="text-xs font-bold text-gray-400 dark:text-gray-600">{timeLabel}</span>
                                                </div>
                                                <div className="flex-1 relative pb-2 border-l-2 border-dashed border-gray-200 dark:border-gray-800 pl-4 min-h-[3.5rem]">
                                                    <div className="absolute top-2 -left-1 w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-800" />
                                                    {slot.status === 'occupied' ? (
                                                        <div className="-mt-1 opacity-80 scale-95 origin-top-left">
                                                            <TurnoMobileCard
                                                                appointment={{
                                                                    ...slot,
                                                                    _id: slot.appointmentId,
                                                                    startTime: slot.startAt,
                                                                    endTime: slot.endAt,
                                                                    patientName: slot.patientName || 'Paciente',
                                                                }}
                                                                onStatusChange={onStatusChange}
                                                                onClick={() => setActionSheetApp({
                                                                    ...slot,
                                                                    _id: slot.appointmentId,
                                                                    startTime: slot.startAt,
                                                                    endTime: slot.endAt,
                                                                    patientName: slot.patientName || 'Paciente',
                                                                })}
                                                            />
                                                        </div>
                                                    ) : slot.status === 'blocked' ? (
                                                        <div className="-mt-1 flex items-center gap-2 pl-4 h-[3rem] text-gray-400 dark:text-gray-500 text-sm font-medium">Bloqueado</div>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleSlotClick(slot)}
                                                            className={`-mt-2 w-full flex items-center justify-center gap-2 h-[3rem] border-2 border-dashed rounded-xl text-sm font-medium transition-colors ${rescheduleTargetApp ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 hover:border-amber-400' : 'border-gray-200 dark:border-gray-800 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}`}
                                                        >
                                                            {rescheduleTargetApp ? 'Mover turno aquí' : <><Plus size={16} /> Agregar Turno</>}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Day Timeline Body — uses REAL backend slots */
                <div className="flex-1 px-4 py-6 space-y-4">
                    {selectedDaySlots.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 py-16">
                            <CalendarDays size={48} className="mb-4 opacity-40" />
                            <p className="text-base font-medium">Sin disponibilidad para este día</p>
                            <p className="text-sm mt-1">Seleccioná otro día en el calendario</p>
                        </div>
                    ) : (
                        selectedDaySlots.map((slot, idx) => {
                            const startTime = new Date(slot.startAt);
                            const timeLabel = `${startTime.getUTCHours().toString().padStart(2, '0')}:${startTime.getUTCMinutes().toString().padStart(2, '0')}`;

                            return (
                                <div key={idx} className="flex gap-4 relative">
                                    {/* Time Column */}
                                    <div className="w-12 flex-shrink-0 text-right">
                                        <span className="text-xs font-bold text-gray-400 dark:text-gray-600">
                                            {timeLabel}
                                        </span>
                                    </div>

                                    {/* Content Column */}
                                    <div className="flex-1 relative pb-2 border-l-2 border-dashed border-gray-200 dark:border-gray-800 pl-4 min-h-[3.5rem]">
                                        <div className="absolute top-2 -left-1 w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-800" />

                                        {slot.status === 'occupied' ? (
                                            <div className="-mt-1">
                                                <TurnoMobileCard
                                                    appointment={{
                                                        ...slot,
                                                        _id: slot.appointmentId,
                                                        startTime: slot.startAt,
                                                        endTime: slot.endAt,
                                                        patientName: slot.patientName || 'Paciente',
                                                    }}
                                                    onStatusChange={onStatusChange}
                                                    onClick={() => setActionSheetApp({
                                                        ...slot,
                                                        _id: slot.appointmentId,
                                                        startTime: slot.startAt,
                                                        endTime: slot.endAt,
                                                        patientName: slot.patientName || 'Paciente',
                                                    })}
                                                />
                                            </div>
                                        ) : slot.status === 'blocked' ? (
                                            <div className="-mt-1 flex items-center gap-2 pl-4 h-[3rem] text-gray-400 dark:text-gray-500 text-sm font-medium">
                                                Bloqueado
                                            </div>
                                        ) : (
                                            /* Available slot — uses real backend start/end times */
                                            <button
                                                onClick={() => handleSlotClick(slot)}
                                                className={`w-full -mt-1 h-full min-h-[3rem] flex items-center gap-2 pl-4 rounded-xl border border-dashed transition-colors group cursor-pointer ${rescheduleTargetApp ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 hover:border-amber-400' : 'border-transparent hover:border-indigo-300 dark:hover:border-indigo-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${rescheduleTargetApp ? 'bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100' : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30'}`}>
                                                    <Plus size={16} />
                                                </div>
                                                <span className="text-sm font-medium">{rescheduleTargetApp ? 'Mover turno aquí' : 'Disponible'}</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Action Sheet for selected turno */}
            {actionSheetApp && (
                <TurnoActionSheet
                    open={!!actionSheetApp}
                    onOpenChange={(open) => { if (!open) setActionSheetApp(null); }}
                    appointment={actionSheetApp}
                    onMarkCompleted={(id) => onStatusChange?.(id, 'completed')}
                    onReschedule={(id) => onStatusChange?.(id, 'pending')}
                    onDelete={onDelete}
                    onCancel={onCancel}
                    onRequestReschedule={() => {
                        setRescheduleTargetApp(actionSheetApp);
                        setActionSheetApp(null);
                    }}
                />
            )}
        </div>
    );
}
