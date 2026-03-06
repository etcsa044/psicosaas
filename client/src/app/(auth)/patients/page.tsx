import { Metadata } from 'next';
import PatientsListPage from '@/features/patients/components/PatientsListPage';

export const metadata: Metadata = {
    title: 'Pacientes - PsicoSaaS',
    description: 'Gestión de pacientes',
};

export default function PatientsPage() {
    return <PatientsListPage />;
}
