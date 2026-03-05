import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import { useCreatePatient } from '../hooks/useCreatePatient';

const createPatientSchema = z.object({
    firstName: z.string().min(1, 'El nombre es requerido'),
    lastName: z.string().min(1, 'El apellido es requerido'),
    phone: z.string().min(1, 'El teléfono es requerido'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
});

type CreatePatientForm = z.infer<typeof createPatientSchema>;

interface QuickCreatePatientModalProps {
    onClose: () => void;
}

export function QuickCreatePatientModal({ onClose }: QuickCreatePatientModalProps) {
    const { mutateAsync: createPatient, isPending } = useCreatePatient();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreatePatientForm>({
        resolver: zodResolver(createPatientSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            phone: '',
            email: '',
        },
    });

    const onSubmit = async (data: CreatePatientForm) => {
        try {
            await createPatient({
                personalInfo: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone,
                    ...(data.email ? { email: data.email } : {}),
                },
            });
            onClose();
        } catch (error) {
            console.error('Error creating patient:', error);
            alert('Error al crear paciente. Revise los datos y reintente.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Nuevo Paciente</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        Complete los datos básicos para registrar al paciente. Podrá completar su historia clínica luego en la sección Pacientes.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nombre *
                            </label>
                            <input
                                {...register('firstName')}
                                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                placeholder="Ej: Juan"
                            />
                            {errors.firstName && <span className="text-xs text-red-500 mt-1">{errors.firstName.message}</span>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Apellido *
                            </label>
                            <input
                                {...register('lastName')}
                                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                placeholder="Ej: Pérez"
                            />
                            {errors.lastName && <span className="text-xs text-red-500 mt-1">{errors.lastName.message}</span>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Teléfono *
                            </label>
                            <input
                                {...register('phone')}
                                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                placeholder="+54 9 11 1234 5678"
                            />
                            {errors.phone && <span className="text-xs text-red-500 mt-1">{errors.phone.message}</span>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Email
                            </label>
                            <input
                                {...register('email')}
                                type="email"
                                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                placeholder="opcional@email.com"
                            />
                            {errors.email && <span className="text-xs text-red-500 mt-1">{errors.email.message}</span>}
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Guardar Paciente
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
