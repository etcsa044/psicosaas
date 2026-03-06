'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Search, Trash2, Clock, Edit2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import toast from 'react-hot-toast';
import PatientEditModal from './PatientEditModal';
import PatientHistoryModal from './PatientHistoryModal';

interface PatientRow {
    _id: string;
    personalInfo: {
        firstName: string;
        lastName: string;
        phone: string;
        email?: string;
    };
    patientType: string;
    status: string;
}

function usePatientsFull(search: string) {
    return useQuery<{ data: PatientRow[] }>({
        queryKey: ['patients', 'full-list', search],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            params.set('limit', '50');
            const { data } = await api.get(`/patients?${params.toString()}`);
            return data;
        },
        placeholderData: (prev) => prev,
        staleTime: 15_000,
    });
}

export default function PatientsListPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const { data, isLoading, isError } = usePatientsFull(debouncedSearch);

    const patients = data?.data || [];

    const [editingPatient, setEditingPatient] = useState<PatientRow | null>(null);
    const [historyPatient, setHistoryPatient] = useState<PatientRow | null>(null);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`¿Estás seguro de eliminar a ${name}?`)) return;
        try {
            await api.delete(`/patients/${id}`);
            toast.success(`Paciente ${name} eliminado`);
        } catch {
            toast.error('Error al eliminar paciente');
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pacientes</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {patients.length} paciente{patients.length !== 1 ? 's' : ''} registrado{patients.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar paciente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2.5 w-full sm:w-80 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                </div>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                </div>
            )}

            {isError && (
                <div className="text-center py-16 text-red-500">
                    Error cargando pacientes. Asegurate de que el servidor esté corriendo.
                </div>
            )}

            {!isLoading && !isError && patients.length === 0 && (
                <div className="text-center py-16">
                    <p className="text-gray-500 dark:text-gray-400 text-lg">No se encontraron pacientes</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Creá uno desde la agenda arrastrando desde el panel lateral</p>
                </div>
            )}

            {!isLoading && !isError && patients.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                    <th className="text-left px-6 py-3 font-semibold text-gray-600 dark:text-gray-300">Nombre</th>
                                    <th className="text-left px-6 py-3 font-semibold text-gray-600 dark:text-gray-300">Teléfono</th>
                                    <th className="text-left px-6 py-3 font-semibold text-gray-600 dark:text-gray-300 hidden md:table-cell">Email</th>
                                    <th className="text-left px-6 py-3 font-semibold text-gray-600 dark:text-gray-300 hidden lg:table-cell">Tipo</th>
                                    <th className="text-left px-6 py-3 font-semibold text-gray-600 dark:text-gray-300 hidden lg:table-cell">Estado</th>
                                    <th className="text-right px-6 py-3 font-semibold text-gray-600 dark:text-gray-300">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {patients.map((p) => (
                                    <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {p.personalInfo.firstName} {p.personalInfo.lastName}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                            {p.personalInfo.phone || '—'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400 hidden md:table-cell">
                                            {p.personalInfo.email || '—'}
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
                                                {p.patientType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.status === 'active'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                                }`}>
                                                {p.status === 'active' ? 'Activo' : p.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    title="Ver historial"
                                                    onClick={() => setHistoryPatient(p)}
                                                    className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                >
                                                    <Clock size={16} />
                                                </button>
                                                <button
                                                    title="Editar"
                                                    onClick={() => setEditingPatient(p)}
                                                    className="p-2 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    title="Eliminar"
                                                    onClick={() => handleDelete(p._id, `${p.personalInfo.firstName} ${p.personalInfo.lastName}`)}
                                                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modals */}
            {editingPatient && (
                <PatientEditModal
                    isOpen={!!editingPatient}
                    onClose={() => setEditingPatient(null)}
                    patientId={editingPatient._id}
                    initialData={{
                        firstName: editingPatient.personalInfo.firstName,
                        lastName: editingPatient.personalInfo.lastName,
                        phone: editingPatient.personalInfo.phone,
                        email: editingPatient.personalInfo.email,
                        patientType: editingPatient.patientType,
                    }}
                />
            )}

            {historyPatient && (
                <PatientHistoryModal
                    isOpen={!!historyPatient}
                    onClose={() => setHistoryPatient(null)}
                    patientId={historyPatient._id}
                    patientName={`${historyPatient.personalInfo.firstName} ${historyPatient.personalInfo.lastName}`}
                />
            )}
        </div>
    );
}
