import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

interface DeleteParams {
    appointmentId: string;
    recurringMode?: 'single' | 'forward' | 'all';
}

export function useDeleteAppointment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ appointmentId, recurringMode }: DeleteParams) => {
            // If recurring mode is 'forward' or 'all', cancel the series instead of deleting
            // (the backend doesn't have a "delete series" endpoint, so we cancel them)
            if (recurringMode && recurringMode !== 'single') {
                const { data } = await api.patch(`/appointments/recurring/${appointmentId}/cancel`, {
                    source: 'PROFESSIONAL',
                    reason: 'Eliminado por el profesional',
                });
                return data;
            }

            // Single appointment delete (default)
            const { data } = await api.delete(`/appointments/${appointmentId}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agenda', 'week'] });
        },
    });
}
