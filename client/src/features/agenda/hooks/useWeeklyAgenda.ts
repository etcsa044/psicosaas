import { useQuery } from '@tanstack/react-query';
import { agendaService } from '../services/agenda.service';

export function useWeeklyAgenda(startISO: string) {
    return useQuery({
        queryKey: ['agenda', 'week', startISO],
        queryFn: () => agendaService.getWeeklyAgenda(startISO),
        staleTime: 0, // Always fetch latest for now to guarantee accuracy
        refetchOnWindowFocus: false, // Prevent noise during development
        enabled: Boolean(startISO)
    });
}
