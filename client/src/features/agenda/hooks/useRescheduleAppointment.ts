import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

interface RescheduleParams {
    appointmentId: string;
    newStartUTC: string;
    overrideFrequencyAlert?: boolean;
}

export function useRescheduleAppointment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ appointmentId, newStartUTC, overrideFrequencyAlert }: RescheduleParams) => {
            const { data } = await api.patch(`/appointments/${appointmentId}/reschedule`, {
                newStartUTC,
                overrideFrequencyAlert
            });
            return data;
        },
        onSuccess: () => {
            // Invalidate weekly agenda to reflect changes
            queryClient.invalidateQueries({ queryKey: ['agenda', 'week'] });
        },
    });
}
