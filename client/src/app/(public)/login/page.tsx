import Link from 'next/link';
import { LoginForm } from '@/features/auth/components/LoginForm';

export const metadata = {
    title: 'Iniciar Sesión - PsicoSaaS',
    description: 'Ingresá a tu cuenta de PsicoSaaS',
};

export default function LoginPage() {
    return (
        <>
            <div className="mb-6 flex flex-col items-center">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Bienvenido de nuevo
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Ingresá tus credenciales para continuar
                </p>
            </div>

            <LoginForm />

            <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    ¿No tenés una cuenta?{' '}
                    <Link
                        href="/register"
                        className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                    >
                        Registrate acá
                    </Link>
                </p>
            </div>
        </>
    );
}
