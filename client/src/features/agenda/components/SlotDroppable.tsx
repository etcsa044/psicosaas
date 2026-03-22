import { useDroppable } from '@dnd-kit/core';
import { Slot } from '../types/agenda.types';
import { OccupiedSlot } from './OccupiedSlot';

interface SlotDroppableProps {
    slot: Slot;
    onAppointmentClick?: (slot: Slot) => void;
}

export function SlotDroppable({ slot, onAppointmentClick, onEmptySlotClick }: SlotDroppableProps & { onEmptySlotClick?: (slot: Slot) => void }) {
    const { setNodeRef, isOver } = useDroppable({
        id: slot.startAt,
        data: {
            type: 'slot',
            slot,
        },
        disabled: slot.status !== 'available',
    });

    if (slot.status === 'occupied') {
        return <OccupiedSlot slot={slot} onClick={() => onAppointmentClick?.(slot)} />;
    }

    const startHour = new Date(slot.startAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false });
    const endHour = new Date(slot.endAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false });

    let bgClass = 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400';

    if (slot.status === 'available') {
        bgClass = isOver
            ? 'bg-green-100 dark:bg-green-900/40 border-green-500 text-green-800 dark:text-green-200 shadow ring-2 ring-green-500 ring-opacity-50'
            : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors shadow-sm';
    }

    return (
        <div
            ref={setNodeRef}
            onClick={() => {
                if (slot.status === 'available') {
                    onEmptySlotClick?.(slot);
                }
            }}
            className={`border rounded-lg p-2 flex flex-col items-center justify-center text-xs font-medium ${bgClass} ${slot.status === 'available' ? 'cursor-pointer' : ''}`}
        >
            <span>{startHour}</span>
            <span className="text-[10px] opacity-70">{endHour}</span>
        </div>
    );
}
