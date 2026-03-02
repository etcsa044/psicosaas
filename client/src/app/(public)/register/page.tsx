import Link from 'next/link';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export const metadata = {
    title: 'Registrarse - PsicoSaaS',
    description: 'Creá tu cuenta en PsicoSaaS',
};

export default function RegisterPage() {
    return (
        <>
            <div className="mb-6 flex flex-col items-center">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Crear cuenta
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Comenzá a gestionar tu consultorio hoy
                </p>
            </div>

            <RegisterForm />

            <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    ¿Ya tenés una cuenta?{' '}
                    <Link
                        href="/login"
                        className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                    >
                        Ingresá acá
                    </Link>
                </p>
            </div>
        </>
    );
}
