import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

export function useCancelAppointment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ appointmentId, source, reason }: { appointmentId: string; source?: string; reason?: string }) => {
            const { data } = await api.patch(`/appointments/${appointmentId}/cancel`, {
                source: source || 'PROFESSIONAL',
                reason
            });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agenda', 'week'] });
        },
    });
}
