import React from 'react';
import { SlotDroppable } from './SlotDroppable';
import { Slot } from '../types/agenda.types';

interface DayAgenda {
    date: Date | string;
    slots: Slot[];
}

interface DayViewProps {
    dayAgenda: DayAgenda;
    onEmptySlotClick: (slot: Slot) => void;
    onAppointmentClick: (slot: Slot) => void;
}

export function DayView({ dayAgenda, onEmptySlotClick, onAppointmentClick }: DayViewProps) {
    if (!dayAgenda) return null;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden max-w-4xl mx-auto">
            <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 text-center">
                <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                    {new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(dayAgenda.date))}
                </h3>
            </div>

            <div className="p-4 flex flex-col gap-2">
                {dayAgenda.slots.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">No hay horarios configurados</div>
                ) : (
                    dayAgenda.slots.map((slot, i) => (
                        <div key={i}>
                            <SlotDroppable
                                slot={slot}
                                onEmptySlotClick={onEmptySlotClick}
                                onAppointmentClick={onAppointmentClick}
                            />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
