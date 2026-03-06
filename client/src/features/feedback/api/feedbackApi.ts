import { api } from '@/lib/axios';

export interface Feedback {
    _id: string;
    type: 'bug' | 'feature' | 'improvement';
    title: string;
    description: string;
    status: 'new' | 'in_progress' | 'resolved';
    createdAt: string;
    user: {
        _id: string;
        email: string;
        profile: { firstName: string; lastName: string };
    };
    metadata?: Record<string, any>;
}

export const feedbackApi = {
    getFeedbacks: async () => {
        const response = await api.get<{ status: string; data: Feedback[] }>('/feedback');
        return response.data.data;
    },
    createFeedback: async (data: Partial<Feedback>) => {
        const response = await api.post('/feedback', data);
        return response.data;
    }
};
