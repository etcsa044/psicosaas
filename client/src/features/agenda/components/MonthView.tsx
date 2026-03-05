import React from 'react';
import { useAgendaUIStore } from '../stores/agendaUIStore';
import { Slot } from '../types/agenda.types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DayAgenda {
    date: Date | string;
    slots: Slot[];
}

interface MonthViewProps {
    agendaDays?: DayAgenda[];
}

// Helper to calculate occupancy percentage
function getOccupancy(slots: Slot[]): number {
    if (!slots || slots.length === 0) return 0;

    const validSlots = slots.filter(s => s.status === 'available' || s.status === 'occupied');
    if (validSlots.length === 0) return 0;

    const occupied = validSlots.filter(s => s.status === 'occupied').length;
    return Math.round((occupied / validSlots.length) * 100);
}

// Generate calendar grid (pads start/end of month to fill full weeks)
function generateMonthGrid(baseDate: Date, agendaDays: DayAgenda[] | undefined) {
    const year = baseDate.getUTCFullYear();
    const month = baseDate.getUTCMonth();

    const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
    const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));

    // Day of week (0 = Sun, 1 = Mon). Adjust so Monday=0 for ES locale
    let startOffset = firstDayOfMonth.getUTCDay() - 1;
    if (startOffset < 0) startOffset = 6; // Sunday becomes 6

    const daysInMonth = lastDayOfMonth.getUTCDate();

    const grid: { date: Date; isCurrentMonth: boolean; agendaDay?: DayAgenda }[] = [];

    // Previous month padding
    const prevMonthEnd = new Date(Date.UTC(year, month, 0)).getUTCDate();
    for (let i = startOffset - 1; i >= 0; i--) {
        grid.push({
            date: new Date(Date.UTC(year, month - 1, prevMonthEnd - i)),
            isCurrentMonth: false
        });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
        const currentDate = new Date(Date.UTC(year, month, i));
        const dateStr = currentDate.toISOString().split('T')[0];

        grid.push({
            date: currentDate,
            isCurrentMonth: true,
            agendaDay: agendaDays?.find(d => {
                const dayStr = typeof d.date === 'string' ? d.date.split('T')[0] : d.date.toISOString().split('T')[0];
                return dayStr === dateStr;
            })
        });
    }

    // Next month padding (to complete 6 weeks / 42 days grid)
    const remainingDays = 42 - grid.length;
    for (let i = 1; i <= remainingDays; i++) {
        grid.push({
            date: new Date(Date.UTC(year, month + 1, i)),
            isCurrentMonth: false
        });
    }

    return grid;
}

export function MonthView({ agendaDays }: MonthViewProps) {
    const { currentDate, setViewMode, setDate } = useAgendaUIStore();

    // Parse the ISO current string to a Date object in UTC
    const baseDate = new Date(currentDate);

    // If agendaDays is not provided or empty, we use an empty array for calculations
    const grid = generateMonthGrid(baseDate, agendaDays || []);

    const handleDayClick = (date: Date) => {
        setDate(date.toISOString());
        setViewMode('day'); // Switch to day view on click
    };

    const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden min-h-full flex flex-col">
            {/* Headers row */}
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                {weekDays.map(day => (
                    <div key={day} className="py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-6">
                {grid.map((cell, i) => {
                    const isToday = new Date().toISOString().split('T')[0] === cell.date.toISOString().split('T')[0];
                    const occupancy = cell.agendaDay ? getOccupancy(cell.agendaDay.slots) : 0;
                    const hasSlots = cell.agendaDay && cell.agendaDay.slots.length > 0;

                    // Color coding for occupancy
                    let occupancyColor = 'bg-transparent text-gray-400';
                    if (hasSlots) {
                        if (occupancy === 100) occupancyColor = 'bg-red-500 text-white shadow-sm ring-2 ring-red-100 dark:ring-red-900/40';
                        else if (occupancy >= 70) occupancyColor = 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-100 dark:ring-amber-900/40';
                        else if (occupancy >= 30) occupancyColor = 'bg-yellow-400 text-amber-900 shadow-sm ring-2 ring-yellow-100 dark:ring-yellow-900/40';
                        else occupancyColor = 'bg-emerald-500 text-white shadow-sm ring-2 ring-green-100 dark:ring-green-900/40';
                    }

                    return (
                        <div
                            key={i}
                            onClick={() => handleDayClick(cell.date)}
                            className={`min-h-[120px] border-b border-r border-gray-100 dark:border-gray-800 p-2 cursor-pointer transition-colors relative flex items-center justify-center ${!cell.isCurrentMonth ? 'opacity-40 bg-gray-50 dark:bg-gray-900/50' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }`}
                        >
                            <span className={`absolute top-2 right-2 text-sm font-semibold h-7 w-7 flex items-center justify-center rounded-full z-10 ${isToday ? 'bg-indigo-600 text-white shadow-sm' : cell.isCurrentMonth ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-600'
                                }`}>
                                {cell.date.getUTCDate()}
                            </span>

                            {hasSlots ? (
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg transition-transform hover:scale-105 ${occupancyColor}`}>
                                    {occupancy}%
                                </div>
                            ) : (
                                <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">Sin turnos</div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
