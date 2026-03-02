import { Metadata } from 'next';
import { AgendaDashboard } from '@/features/agenda/components/AgendaDashboard';

export const metadata: Metadata = {
    title: 'Agenda - PsicoSaaS',
    description: 'Gestión de turnos y pacientes',
};

export default function DashboardPage() {
    return <AgendaDashboard />;
}
