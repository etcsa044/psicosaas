import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';

interface GoogleIntegrationStatus {
    connected: boolean;
    email: string | null;
    autoMeet: boolean;
}

export function useGoogleStatus() {
    return useQuery<GoogleIntegrationStatus>({
        queryKey: ['google-integration-status'],
        queryFn: async () => {
            const { data } = await api.get('/integrations/google/status');
            return data.data;
        },
    });
}

export function useDisconnectGoogle() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            await api.post('/integrations/google/disconnect');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['google-integration-status'] });
        },
    });
}

export function useUpdateGoogleSettings() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (settings: { autoMeet?: boolean }) => {
            await api.patch('/integrations/google/settings', settings);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['google-integration-status'] });
        },
    });
}
