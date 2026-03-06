import { Metadata } from 'next';
import PatientProfile from '@/features/patients/components/PatientProfile';

export const metadata: Metadata = {
    title: 'Ficha del Paciente - PsicoSaaS',
    description: 'Historia clínica y evoluciones del paciente',
};

// Next.js App Router automatically injects params for dynamic routes
export default async function PatientProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <PatientProfile patientId={id} />;
}
