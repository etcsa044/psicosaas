import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

export interface DraggablePatient {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    patientType?: string;
}

export function PatientDraggable({ patient }: { patient: DraggablePatient }) {
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
            <div className="flex items-center justify-between">
                <p className="font-medium text-sm text-gray-900 dark:text-white truncate" title={`${patient.firstName} ${patient.lastName}`}>
                    {patient.firstName} {patient.lastName}
                </p>
                {patient.patientType && patient.patientType !== 'regular' && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-full uppercase font-bold">
                        {patient.patientType}
                    </span>
                )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={patient.email || patient.phone || ''}>
                {patient.email || patient.phone || ''}
            </p>
        </div>
    );
}
