'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/features/auth/stores/authStore';
import {
    onboardingStep1Schema,
    onboardingStep2Schema,
    onboardingStep3Schema,
    OnboardingFormData,
} from '../schemas/onboardingSchemas';

const PREDEFINED_COLORS = ['#4A90D9', '#2C3E50', '#27AE60', '#8E44AD', '#E67E22'];

export function OnboardingForm() {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const currentTenantId = useAuthStore((s) => s.currentTenantId);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        trigger,
        formState: { errors },
    } = useForm<OnboardingFormData>({
        resolver: (data: any, context: any, options: any) => {
            const schema =
                step === 1
                    ? onboardingStep1Schema
                    : step === 2
                        ? onboardingStep2Schema
                        : onboardingStep3Schema;
            return zodResolver(schema)(data, context, options) as any;
        },
        defaultValues: {
            country: 'AR',
            primaryColor: '#4A90D9',
            tonoDelBot: 'calido',
            nombreDelBot: 'Asistente PsicoSaaS',
        },
    });

    const primaryColorParam = watch('primaryColor');

    const handleNext = async () => {
        const isStepValid = await trigger();
        if (isStepValid) setStep((s) => s + 1);
    };

    const handleBack = () => {
        setStep((s) => s - 1);
    };

    const onSubmit = async (data: OnboardingFormData) => {
        setIsLoading(true);
        try {
            if (!currentTenantId) throw new Error('No tenant ID found');

            // 1. Update Tenant country
            await api.patch(`/tenants/${currentTenantId}`, {
                country: { code: data.country },
            });

            // 2. Update Branding
            await api.patch(`/branding/${currentTenantId}`, {
                nombrePublico: data.nombrePublico,
                primaryColor: data.primaryColor,
                logoUrl: data.logoUrl || undefined,
                nombreDelBot: data.nombreDelBot,
                tonoDelBot: data.tonoDelBot,
            });

            toast.success('¡Configuración guardada!');
            router.push('/dashboard');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error guardando configuración');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center">
                            <div
                                className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= s
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-200 text-gray-500 dark:bg-gray-700'
                                    }`}
                            >
                                {s}
                            </div>
                            {s < 3 && (
                                <div
                                    className={`h-1 w-16 mx-2 ${step > s ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
                {step === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Perfil del Consultorio</h2>
                        <p className="text-sm text-gray-500">¿Cómo te conocen tus pacientes?</p>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Público</label>
                            <input
                                {...register('nombrePublico')}
                                placeholder="Ej: Lic. Juan Pérez / Espacio Mindful"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"
                            />
                            {errors.nombrePublico && <p className="mt-1 text-sm text-red-500">{errors.nombrePublico.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">País</label>
                            <select
                                {...register('country')}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"
                            >
                                <option value="AR">Argentina</option>
                                <option value="CL">Chile</option>
                                <option value="MX">México</option>
                                <option value="CO">Colombia</option>
                                <option value="UY">Uruguay</option>
                                <option value="ES">España</option>
                            </select>
                            {errors.country && <p className="mt-1 text-sm text-red-500">{errors.country.message}</p>}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Identidad Visual</h2>
                        <p className="text-sm text-gray-500">Personalizá cómo ven los pacientes tu espacio</p>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color Principal</label>
                            <div className="flex gap-3">
                                {PREDEFINED_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setValue('primaryColor', color)}
                                        className={`w-10 h-10 rounded-full border-2 transition-transform ${primaryColorParam === color ? 'border-indigo-600 scale-110' : 'border-transparent'
                                            }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                            <input type="hidden" {...register('primaryColor')} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL del Logo (Opcional)</label>
                            <input
                                {...register('logoUrl')}
                                placeholder="https://..."
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"
                            />
                            {errors.logoUrl && <p className="mt-1 text-sm text-red-500">{errors.logoUrl.message}</p>}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Asistente Virtual</h2>
                        <p className="text-sm text-gray-500">Configurá cómo el bot interactúa con tus pacientes</p>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Asistente (Bot)</label>
                            <input
                                {...register('nombreDelBot')}
                                placeholder="Ej: Sofía - Asistente Virtual"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"
                            />
                            {errors.nombreDelBot && <p className="mt-1 text-sm text-red-500">{errors.nombreDelBot.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tono de Comunicación</label>
                            <select
                                {...register('tonoDelBot')}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"
                            >
                                <option value="calido">Cálido y Empático</option>
                                <option value="formal">Formal y Profesional</option>
                                <option value="neutro">Neutro y Directo</option>
                            </select>
                        </div>
                    </div>
                )}

                <div className="flex justify-between pt-6 border-t border-gray-100 dark:border-gray-700 mt-8">
                    {step > 1 ? (
                        <button
                            type="button"
                            onClick={handleBack}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
                        >
                            Atrás
                        </button>
                    ) : (
                        <div />
                    )}

                    {step < 3 ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 shadow-sm"
                        >
                            Siguiente
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 shadow-sm disabled:opacity-50"
                        >
                            {isLoading ? 'Guardando...' : 'Finalizar y Entrar'}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
