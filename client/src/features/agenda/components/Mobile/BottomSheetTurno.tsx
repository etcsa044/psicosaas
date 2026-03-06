'use client';

import { Drawer } from 'vaul';
import { useState } from 'react';
// no button wrapper needed
import { X, Search } from 'lucide-react';

interface BottomSheetTurnoProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialDate?: Date;
    onConfirm: (data: any) => Promise<void>;
}

export default function BottomSheetTurno({ open, onOpenChange, initialDate, onConfirm }: BottomSheetTurnoProps) {
    const [patientSearch, setPatientSearch] = useState('');
    const [selectedType, setSelectedType] = useState('Primera sesión');
    const [isSaving, setIsSaving] = useState(false);

    const handleConfirm = async () => {
        setIsSaving(true);
        try {
            await onConfirm({
                patientId: 'temp_id', // Replace with selected patient
                type: selectedType,
                date: initialDate || new Date()
            });
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Drawer.Root open={open} onOpenChange={onOpenChange}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 transition-opacity" />
                <Drawer.Content className="bg-white dark:bg-gray-900 flex flex-col rounded-t-[20px] h-[85vh] mt-24 fixed bottom-0 left-0 right-0 z-50 outline-none pb-safe">
                    <div className="p-4 bg-white dark:bg-gray-900 rounded-t-[20px] flex-1 flex flex-col gap-4 mx-auto w-full max-w-md">
                        {/* Handle */}
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-700 mb-4" />

                        <div className="flex items-center justify-between mb-2">
                            <Drawer.Title className="font-bold text-xl text-gray-900 dark:text-white">
                                Nuevo Turno
                            </Drawer.Title>
                            <button onClick={() => onOpenChange(false)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl mb-4">
                            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-300">
                                📅 {initialDate ? initialDate.toLocaleString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : 'Seleccione horario...'}
                            </p>
                        </div>

                        {/* Patient Search */}
                        <div className="relative mb-4">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={18} className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out text-gray-900 dark:text-white"
                                placeholder="Buscar paciente por nombre..."
                                value={patientSearch}
                                onChange={(e) => setPatientSearch(e.target.value)}
                            />
                        </div>

                        {/* Session Type */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Tipo de sesión
                            </label>
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option>Primera sesión</option>
                                <option>Seguimiento</option>
                                <option>Aptitud Psicológica</option>
                            </select>
                        </div>

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* Bottom Action */}
                        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800">
                            <button
                                onClick={handleConfirm}
                                disabled={isSaving || !patientSearch}
                                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                            >
                                {isSaving ? 'Guardando...' : 'Confirmar Turno'}
                            </button>
                        </div>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
