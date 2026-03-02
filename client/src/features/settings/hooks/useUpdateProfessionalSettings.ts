import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { IProfessionalSettings } from './useProfessionalSettings';

export const useUpdateProfessionalSettings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: Partial<IProfessionalSettings>) => {
            const { data } = await api.patch('/professional-settings', payload);
            return data.data;
        },
        onSuccess: () => {
            // Invalidate the settings
            queryClient.invalidateQueries({ queryKey: ['professional-settings'] });

            // Invalidate the agenda to regenerate slots taking new duration into account
            queryClient.invalidateQueries({ queryKey: ['agenda', 'week'] });
        },
    });
};
