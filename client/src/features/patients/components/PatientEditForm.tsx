'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface PatientEditFormProps {
    patientId: string;
    initialData: {
        firstName: string;
        lastName: string;
        phone: string;
        email?: string;
        patientType: string;
    };
}

export default function PatientEditForm({ patientId, initialData }: PatientEditFormProps) {
    const queryClient = useQueryClient();

    const [firstName, setFirstName] = useState(initialData.firstName);
    const [lastName, setLastName] = useState(initialData.lastName);
    const [phone, setPhone] = useState(initialData.phone);
    const [email, setEmail] = useState(initialData.email || '');
    const [patientType, setPatientType] = useState(initialData.patientType || 'semanal');

    // Update state if initialData changes (e.g. refetch)
    useEffect(() => {
        setFirstName(initialData.firstName);
        setLastName(initialData.lastName);
        setPhone(initialData.phone);
        setEmail(initialData.email || '');
        setPatientType(initialData.patientType || 'semanal');
    }, [initialData]);

    const mutation = useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await api.patch(`/patients/${patientId}`, payload);
            return data;
        },
        onSuccess: () => {
            // Also invalidate the specific patient query so the Profile Header updates
            queryClient.invalidateQueries({ queryKey: ['patients'] });
            toast.success('Datos del paciente actualizados');
        },
        onError: () => {
            toast.error('Error al actualizar paciente');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!firstName.trim() || !lastName.trim() || !phone.trim() || !email.trim()) {
            toast.error('Nombre, apellido, email y teléfono son obligatorios');
            return;
        }

        mutation.mutate({
            personalInfo: {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phone: phone.trim(),
                email: email.trim() || undefined,
            },
            patientType,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                    <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellido</label>
                    <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frecuencia de Sesiones</label>
                <select
                    value={patientType}
                    onChange={(e) => setPatientType(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                    <option value="semanal">Semanal</option>
                    <option value="quincenal">Quincenal</option>
                    <option value="mensual">Mensual</option>
                    <option value="personalizado">Personalizado / Flotante</option>
                </select>
            </div>

            <div className="pt-4 flex justify-end mt-6">
                <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                    {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Guardar Cambios
                </button>
            </div>
        </form>
    );
}
