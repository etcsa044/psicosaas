import { useDraggable } from '@dnd-kit/core';
import { Slot } from '../types/agenda.types';

interface OccupiedSlotProps {
    slot: Slot;
    onClick: () => void;
}

export function OccupiedSlot({ slot, onClick }: OccupiedSlotProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `appt-${slot.appointmentId}`,
        data: {
            type: 'appointment',
            slot,
            appointmentId: slot.appointmentId
        }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
    } : undefined;

    const startHour = new Date(slot.startAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
    const endHour = new Date(slot.endAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });

    let typeColor = 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'; // Semanal / Default
    if (slot.patientType === 'quincenal') typeColor = 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200';
    if (slot.patientType === 'mensual') typeColor = 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200';
    if (slot.patientType === 'personalizado') typeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={(e) => {
                // Prevent drag click from firing popover directly if dragging
                if (isDragging) return;
                onClick();
            }}
            className={`border rounded-xl p-2.5 flex flex-col justify-between text-xs font-medium cursor-grab active:cursor-grabbing shadow-sm border-indigo-200 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-800 hover:shadow-md transition-shadow relative overflow-hidden group ${isDragging ? 'opacity-50 !shadow-lg ring-2 ring-indigo-500 scale-105' : ''}`}
        >
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 dark:bg-indigo-400"></div>

            <div className="flex justify-between items-start mb-1 pl-1">
                <div className="flex items-center gap-1 w-full overflow-hidden">
                    <span className="text-[10px]">{slot.modality === 'video_call' ? '💻' : '📍'}</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100 truncate w-full" title={slot.patientName}>{slot.patientName}</span>
                </div>
            </div>

            <div className="flex justify-between items-end pl-1 mt-1">
                <div className="flex flex-col">
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 font-normal">
                        {startHour} - {endHour}
                    </div>
                    <div className="text-[10px] text-indigo-700 dark:text-indigo-300 font-medium capitalize mt-0.5">
                        {slot.appointmentType || 'Sesión'}
                    </div>
                </div>
                {slot.patientType && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold ${typeColor}`}>
                        {slot.patientType}
                    </span>
                )}
            </div>
        </div>
    );
}
