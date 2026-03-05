import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';

export interface CreatePatientInput {
    personalInfo: {
        firstName: string;
        lastName: string;
        phone: string;
        email?: string;
    };
}

export const useCreatePatient = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreatePatientInput) => {
            const response = await api.post('/patients', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patients'] });
        },
    });
};
