import { Metadata } from 'next';
import AdminFeedbackDashboard from '@/features/feedback/components/AdminFeedbackDashboard';

export const metadata: Metadata = {
    title: 'Bandeja de Feedback - PsicoSaaS',
    description: 'Visualiza el feedback enviado por los usuarios',
};

export default function FeedbackRoutePage() {
    return <AdminFeedbackDashboard />;
}
