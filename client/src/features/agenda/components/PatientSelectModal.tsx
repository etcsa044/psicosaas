import { X, Search, Loader2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Slot } from '../types/agenda.types';
import { usePatients, PatientListItem } from '../hooks/usePatients';
import { useDebounce } from '../../../hooks';

interface PatientSelectModalProps {
    slot: Slot;
    onSelect: (patientId: string, slot: Slot) => void;
    onClose: () => void;
}

export function PatientSelectModal({ slot, onSelect, onClose }: PatientSelectModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const { data: patientsData, isLoading } = usePatients(debouncedSearch);

    const patients = useMemo(() => patientsData?.data || [], [patientsData]);

    const startFormatted = new Date(slot.startAt).toLocaleString('es-AR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC'
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
                            placeholder="Buscar paciente por nombre, email o teléfono..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="animate-spin w-5 h-5 text-indigo-500" />
                        </div>
                    ) : patients.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 text-sm">
                            {searchTerm ? 'No se encontraron pacientes' : 'No hay pacientes registrados'}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {patients.map((patient: PatientListItem) => (
                                <button
                                    key={patient._id}
                                    onClick={() => onSelect(patient._id, slot)}
                                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors flex items-center justify-between group"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {patient.personalInfo.firstName} {patient.personalInfo.lastName}
                                            </p>
                                            {patient.patientType !== 'regular' && (
                                                <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-full uppercase font-bold">
                                                    {patient.patientType}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            {patient.personalInfo.email || patient.personalInfo.phone || ''}
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
