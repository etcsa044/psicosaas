'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Search, Trash2, Clock, Edit2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

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

    const router = useRouter();
    const [deleteIntent, setDeleteIntent] = useState<{ id: string, name: string } | null>(null);

    const { refetch } = usePatientsFull(debouncedSearch);

    const confirmDelete = async () => {
        if (!deleteIntent) return;
        try {
            await api.delete(`/patients/${deleteIntent.id}`);
            toast.success(`Paciente ${deleteIntent.name} eliminado`);
            setDeleteIntent(null);
            refetch();
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
                                    <tr
                                        key={p._id}
                                        onClick={() => router.push(`/patients/${p._id}`)}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer"
                                    >
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
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 capitalize">
                                                {p.patientType === 'regular' ? 'semanal' :
                                                    p.patientType === 'intensive' ? 'quincenal' :
                                                        p.patientType === 'vip' ? 'mensual' :
                                                            p.patientType}
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
                                                    title="Abrir Ficha Clínica"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/patients/${p._id}`);
                                                    }}
                                                    className="p-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors font-medium text-sm flex gap-1 items-center"
                                                >
                                                    Abrir Ficha
                                                </button>
                                                <button
                                                    title="Eliminar"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteIntent({ id: p._id, name: `${p.personalInfo.firstName} ${p.personalInfo.lastName}` });
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ml-2"
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

            {deleteIntent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteIntent(null)} />
                    <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-6 text-center animate-fade-in">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Eliminar Paciente</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            ¿Estás seguro que deseas eliminar a <strong>{deleteIntent.name}</strong>? Esta acción no se puede deshacer.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setDeleteIntent(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
                            >
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
