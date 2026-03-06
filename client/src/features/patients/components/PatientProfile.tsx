'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { ArrowLeft, User, Calendar, FileText, Paperclip, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PatientEditForm from './PatientEditForm';
import AppointmentHistoryList from './AppointmentHistoryList';
import EvolutionList from './EvolutionList';
import PatientDocumentList from './PatientDocumentList';

interface PatientProfileProps {
    patientId: string;
}

type TabType = 'datos' | 'turnos' | 'evoluciones' | 'documentos';

export default function PatientProfile({ patientId }: PatientProfileProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('evoluciones'); // Default to the most used tab

    // Fetch basic patient info for the header
    const { data: patientData, isLoading } = useQuery({
        queryKey: ['patients', patientId],
        queryFn: async () => {
            const { data } = await api.get(`/patients/${patientId}`);
            return data.data; // backend wraps in {status, data}
        },
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    if (!patientData) {
        return <div className="p-6 text-center text-gray-500">Paciente no encontrado</div>;
    }

    const { personalInfo, patientType, status } = patientData;

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Navigation & Header */}
            <div>
                <button
                    onClick={() => router.push('/patients')}
                    className="flex items-center text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
                >
                    <ArrowLeft size={16} className="mr-1" />
                    Volver a pacientes
                </button>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 rounded-full flex items-center justify-center text-2xl font-bold uppercase ring-4 ring-white dark:ring-gray-800">
                            {personalInfo.firstName[0]}
                            {personalInfo.lastName[0]}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                {personalInfo.firstName} {personalInfo.lastName}
                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${status === 'active'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400'
                                    }`}>
                                    {status === 'active' ? 'Activo' : 'Inactivo'}
                                </span>
                            </h1>
                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                                <span>{personalInfo.phone}</span>
                                {personalInfo.email && <span>• {personalInfo.email}</span>}
                                <span className="capitalize">• {
                                    patientType === 'regular' ? 'semanal' :
                                        patientType === 'intensive' ? 'quincenal' :
                                            patientType === 'vip' ? 'mensual' : patientType
                                }</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                    {[
                        { id: 'datos', name: 'Datos Personales', icon: User },
                        { id: 'turnos', name: 'Historial de Turnos', icon: Calendar },
                        { id: 'evoluciones', name: 'Evoluciones Clínicas', icon: FileText },
                        { id: 'documentos', name: 'Documentos', icon: Paperclip },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`
                                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
                                    ${isActive
                                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}
                                `}
                            >
                                <Icon size={16} />
                                {tab.name}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content Area */}
            <div className="mt-6">
                {activeTab === 'datos' && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Datos Personales</h2>
                        <PatientEditForm
                            patientId={patientId}
                            initialData={{
                                firstName: personalInfo.firstName,
                                lastName: personalInfo.lastName,
                                phone: personalInfo.phone,
                                email: personalInfo.email,
                                patientType: patientType,
                            }}
                        />
                    </div>
                )}

                {activeTab === 'turnos' && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Turnos y Cancelaciones</h2>
                        </div>
                        <div className="p-0 sm:p-2 bg-gray-50/50 dark:bg-gray-900/20">
                            <AppointmentHistoryList patientId={patientId} />
                        </div>
                    </div>
                )}

                {activeTab === 'evoluciones' && (
                    <div className="bg-gray-50/50 dark:bg-gray-900/20 p-2 rounded-xl">
                        <EvolutionList patientId={patientId} />
                    </div>
                )}

                {activeTab === 'documentos' && (
                    <div className="bg-gray-50/50 dark:bg-gray-900/20 p-0 sm:p-2 rounded-xl">
                        <PatientDocumentList patientId={patientId} />
                    </div>
                )}
            </div>
        </div>
    );
}
