import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

interface CancelParams {
    appointmentId: string;
    source?: string;
    reason?: string;
    recurringMode?: 'single' | 'forward' | 'all';
}

export function useCancelAppointment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ appointmentId, source, reason, recurringMode }: CancelParams) => {
            // If recurring mode is 'forward' or 'all', use the recurring cancel endpoint
            if (recurringMode && recurringMode !== 'single') {
                const { data } = await api.patch(`/appointments/recurring/${appointmentId}/cancel`, {
                    source: source || 'PROFESSIONAL',
                    reason: reason || 'Cancelado por el profesional',
                });
                return data;
            }

            // Single appointment cancel (default)
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
