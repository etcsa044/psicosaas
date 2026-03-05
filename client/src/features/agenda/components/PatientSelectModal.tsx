import { X, Search } from 'lucide-react';
import { useState } from 'react';
import { Slot } from '../types/agenda.types';

interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
}

interface PatientSelectModalProps {
    slot: Slot;
    patients: Patient[];
    onSelect: (patientId: string, slot: Slot) => void;
    onClose: () => void;
}

export function PatientSelectModal({ slot, patients, onSelect, onClose }: PatientSelectModalProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPatients = patients.filter(
        (p) =>
            p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const startFormatted = new Date(slot.startAt).toLocaleString('es-AR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC' // MVP data is UTC
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nuevo Turno</h3>
                        <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">{startFormatted}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar paciente por nombre o email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {filteredPatients.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 text-sm">
                            No se encontraron pacientes
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredPatients.map((patient) => (
                                <button
                                    key={patient.id}
                                    onClick={() => onSelect(patient.id, slot)}
                                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors flex items-center justify-between group"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {patient.firstName} {patient.lastName}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            {patient.email}
                                        </p>
                                    </div>
                                    <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Seleccionar
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
