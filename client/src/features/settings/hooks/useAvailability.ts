import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';

export interface AvailabilityPattern {
    _id?: string;
    dayOfWeek: number;
    startMinutes: number;
    endMinutes: number;
    slotDuration: number;
    bufferMinutes: number;
    modality?: 'in_person' | 'video_call';
}

export interface AvailabilityException {
    _id: string;
    date: string;
    blocked: boolean;
    reason?: string;
    customSlots?: { startMinutes: number; endMinutes: number }[];
}

export function useAvailabilityPatterns() {
    return useQuery<AvailabilityPattern[]>({
        queryKey: ['availability-patterns'],
        queryFn: async () => {
            const { data } = await api.get('/availability/patterns');
            return data.data;
        },
    });
}

export function useUpdateAvailabilityPatterns() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (patterns: Partial<AvailabilityPattern>[]) => {
            const { data } = await api.put('/availability/patterns', { patterns });
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['availability-patterns'] });
            queryClient.invalidateQueries({ queryKey: ['weekly-agenda'] });
        },
    });
}

export function useAvailabilityExceptions(monthIsoDate?: string) {
    return useQuery<AvailabilityException[]>({
        queryKey: ['availability-exceptions', monthIsoDate],
        queryFn: async () => {
            const params: any = {};
            if (monthIsoDate) {
                // Approximate window: fetching a wide range just to be safe, e.g. 60 days around the date
                const d = new Date(monthIsoDate);
                const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1));
                const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 2, 0));
                params.startDate = start.toISOString();
                params.endDate = end.toISOString();
            }
            const { data } = await api.get('/availability/exceptions', { params });
            return data.data;
        },
    });
}

export function useSetAvailabilityException() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { date: string; blocked: boolean; reason?: string }) => {
            const { data } = await api.post('/availability/exceptions', payload);
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['availability-exceptions'] });
            queryClient.invalidateQueries({ queryKey: ['weekly-agenda'] });
        },
    });
}

export function useDeleteAvailabilityException() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.delete(`/availability/exceptions/${id}`);
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['availability-exceptions'] });
            queryClient.invalidateQueries({ queryKey: ['weekly-agenda'] });
        },
    });
}
