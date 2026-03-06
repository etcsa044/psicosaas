import { Metadata } from 'next';
import FeedbackPage from '@/features/feedback/components/FeedbackPage';

export const metadata: Metadata = {
    title: 'Feedback - PsicoSaaS',
    description: 'Envía tu feedback para mejorar el sistema',
};

export default function FeedbackRoutePage() {
    return <FeedbackPage />;
}
