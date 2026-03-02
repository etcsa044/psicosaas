import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

export interface IWeeklyFrequencyPolicy {
    mode: 'none' | 'alert' | 'block';
    maxPerWeek?: number;
}

export interface IProfessionalSettings {
    _id: string;
    tenantId: string;
    professionalId: string;
    defaultRules: {
        weeklyFrequencyPolicy: IWeeklyFrequencyPolicy;
        appointmentDurationMinutes: number;
    };
    patientTypeOverrides: Record<string, { weeklyFrequencyPolicy: IWeeklyFrequencyPolicy }>;
}

export const useProfessionalSettings = () => {
    return useQuery<IProfessionalSettings>({
        queryKey: ['professional-settings'],
        queryFn: async () => {
            const { data } = await api.get('/professional-settings');
            return data.data; // Accessing wrapped `data` payload
        },
    });
};
