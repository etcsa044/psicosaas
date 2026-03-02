import { OnboardingForm } from '@/features/tenant/components/OnboardingForm';

export const metadata = {
    title: 'Completar Perfil - PsicoSaaS',
    description: 'Configurá tu consultorio en PsicoSaaS',
};

export default function OnboardingPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-10">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                    ¡Casi listo! Configurá tu espacio
                </h1>
                <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
                    Llená estos datos básicos para que tus pacientes y el asistente virtual tengan el contexto de tu consultorio.
                </p>
            </div>

            <OnboardingForm />
        </div>
    );
}
