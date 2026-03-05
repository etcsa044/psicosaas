import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

export interface PatientListItem {
    _id: string;
    personalInfo: {
        firstName: string;
        lastName: string;
        phone: string;
        email?: string;
    };
    patientType: string;
    status: string;
}

interface PatientsResponse {
    status: string;
    data: PatientListItem[];
    pagination: {
        hasMore: boolean;
        nextCursor: string | null;
    };
}

export function usePatients(search: string) {
    return useQuery<PatientsResponse>({
        queryKey: ['patients', 'list', search],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            params.set('limit', '20');
            const { data } = await api.get(`/patients?${params.toString()}`);
            return data;
        },
        // Keep previous data while fetching new results for smooth UX
        placeholderData: (previousData) => previousData,
        // Debounce is handled at the component level, but also staleTime
        staleTime: 10_000,
    });
}
