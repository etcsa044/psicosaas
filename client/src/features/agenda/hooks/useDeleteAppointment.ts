import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

export function useDeleteAppointment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (appointmentId: string) => {
            const { data } = await api.delete(`/appointments/${appointmentId}`);
            return data;
        },
        onSuccess: () => {
            // Invalidate weekly agenda to reflect changes
            queryClient.invalidateQueries({ queryKey: ['agenda', 'week'] });
        },
    });
}
