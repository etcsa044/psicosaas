import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface PatientMock {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
}

export function PatientDraggable({ patient }: { patient: PatientMock }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: patient.id,
        data: {
            type: 'patient',
            patient,
        },
    });

    const style = transform ? {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.6 : 1,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={style}
            className={`p-3 bg-white dark:bg-gray-800 border ${isDragging ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500' : 'border-gray-200 dark:border-gray-700 shadow-sm'} rounded-lg cursor-grab active:cursor-grabbing hover:border-indigo-300 transition-all`}
        >
            <p className="font-medium text-sm text-gray-900 dark:text-white truncate" title={`${patient.firstName} ${patient.lastName}`}>{patient.firstName} {patient.lastName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={patient.email}>{patient.email}</p>
        </div>
    );
}
