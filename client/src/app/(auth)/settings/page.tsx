import { Metadata } from 'next';
import ProfessionalSettingsPage from '@/features/settings/components/ProfessionalSettingsPage';

export const metadata: Metadata = {
    title: 'Configuración - PsicoSaaS',
    description: 'Configuración profesional',
};

export default function SettingsPage() {
    return <ProfessionalSettingsPage />;
}
