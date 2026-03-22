'use client';

import { useMemo } from 'react';

interface MobileMonthViewProps {
    appointments: any[];
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
}

function isSameUTCDay(a: Date, b: Date): boolean {
    return a.getUTCFullYear() === b.getUTCFullYear()
        && a.getUTCMonth() === b.getUTCMonth()
        && a.getUTCDate() === b.getUTCDate();
}

function generateMonthGrid(baseDate: Date) {
    const year = baseDate.getUTCFullYear();
    const month = baseDate.getUTCMonth();

    const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
    const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));

    // Monday = 0 offset
    let startOffset = firstDayOfMonth.getUTCDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const daysInMonth = lastDayOfMonth.getUTCDate();
    const grid: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    const prevMonthEnd = new Date(Date.UTC(year, month, 0)).getUTCDate();
    for (let i = startOffset - 1; i >= 0; i--) {
        grid.push({ date: new Date(Date.UTC(year, month - 1, prevMonthEnd - i)), isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
        grid.push({ date: new Date(Date.UTC(year, month, i)), isCurrentMonth: true });
    }

    // Pad to fill remaining (complete weeks)
    const remainder = grid.length % 7;
    if (remainder > 0) {
        const daysToAdd = 7 - remainder;
        for (let i = 1; i <= daysToAdd; i++) {
            grid.push({ date: new Date(Date.UTC(year, month + 1, i)), isCurrentMonth: false });
        }
    }

    return grid;
}

const WEEKDAY_HEADERS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function MobileMonthView({ appointments, selectedDate, onSelectDate }: MobileMonthViewProps) {
    const todayUTC = useMemo(() => {
        const now = new Date();
        return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    }, []);

    const grid = useMemo(() => generateMonthGrid(selectedDate), [selectedDate]);

    // Group appointments by UTC date string for fast lookup
    const appointmentsByDay = useMemo(() => {
        const map = new Map<string, any[]>();
        for (const a of appointments) {
            const d = new Date(a.startTime);
            const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(a);
        }
        return map;
    }, [appointments]);

    return (
        <div className="bg-white dark:bg-gray-900">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800">
                {WEEKDAY_HEADERS.map(day => (
                    <div key={day} className="py-2 text-center text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
                {grid.map((cell, i) => {
                    const isToday = isSameUTCDay(cell.date, todayUTC);
                    const isSelected = isSameUTCDay(cell.date, selectedDate);
                    const dayKey = `${cell.date.getUTCFullYear()}-${cell.date.getUTCMonth()}-${cell.date.getUTCDate()}`;
                    const dayApps = appointmentsByDay.get(dayKey) || [];
                    const isWeekend = cell.date.getUTCDay() === 0 || cell.date.getUTCDay() === 6;

                    return (
                        <button
                            key={i}
                            onClick={() => onSelectDate(cell.date)}
                            className={`relative flex flex-col items-center py-1.5 min-h-[4.5rem] border-b border-r border-gray-100 dark:border-gray-800 transition-colors
                                ${!cell.isCurrentMonth ? 'opacity-30' : ''}
                                ${isWeekend && cell.isCurrentMonth ? 'bg-gray-50/50 dark:bg-gray-900/50' : ''}
                                ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'active:bg-gray-50 dark:active:bg-gray-800'}
                            `}
                        >
                            {/* Day number */}
                            <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-0.5
                                ${isToday
                                    ? 'bg-indigo-600 text-white'
                                    : isSelected
                                        ? 'text-indigo-600 dark:text-indigo-400'
                                        : 'text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                {cell.date.getUTCDate()}
                            </span>

                            {/* Appointment pills (max 3 visible) */}
                            <div className="flex flex-col gap-0.5 w-full px-0.5 overflow-hidden flex-1">
                                {dayApps.slice(0, 3).map((app: any, j: number) => (
                                    <div
                                        key={j}
                                        className={`text-[8px] leading-tight font-medium truncate px-1 py-px rounded
                                            ${app.status === 'cancelled'
                                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                : app.status === 'completed'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                                            }`}
                                    >
                                        {new Date(app.startTime).getUTCHours().toString().padStart(2, '0')}:{new Date(app.startTime).getUTCMinutes().toString().padStart(2, '0')} {app.patientName?.split(' ')[0] || ''}
                                    </div>
                                ))}
                                {dayApps.length > 3 && (
                                    <span className="text-[8px] text-gray-400 dark:text-gray-500 font-bold text-center">
                                        +{dayApps.length - 3} más
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
