'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { registerSchema, RegisterFormData } from '../schemas/authSchemas';
import { useAuthStore } from '../stores/authStore';
import { setAccessToken } from '@/lib/axios';

export function RegisterForm() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true);
        try {
            const body = {
                email: data.email,
                password: data.password,
                profile: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                },
            };

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Error al registrarse');
            }

            // Set global auth state
            setAccessToken(result.accessToken);
            setAuth(result.user);

            toast.success('¡Cuenta creada exitosamente!');
            router.push('/dashboard');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nombre
                    </label>
                    <div className="mt-1">
                        <input
                            {...register('firstName')}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                        />
                        {errors.firstName && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.firstName.message}</p>
                        )}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Apellido
                    </label>
                    <div className="mt-1">
                        <input
                            {...register('lastName')}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                        />
                        {errors.lastName && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.lastName.message}</p>
                        )}
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                </label>
                <div className="mt-1">
                    <input
                        {...register('email')}
                        type="email"
                        autoComplete="email"
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    />
                    {errors.email && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
                    )}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Contraseña
                </label>
                <div className="mt-1">
                    <input
                        {...register('password')}
                        type="password"
                        autoComplete="new-password"
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    />
                    {errors.password && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
                    )}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirmar Contraseña
                </label>
                <div className="mt-1">
                    <input
                        {...register('confirmPassword')}
                        type="password"
                        autoComplete="new-password"
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    />
                    {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>
                    )}
                </div>
            </div>

            <div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Registrando...' : 'Crear cuenta'}
                </button>
            </div>
        </form>
    );
}
