import { useMutation, useQueryClient } from '@tanstack/react-query';
import { agendaService, CreateAppointmentData } from '../services/agenda.service';

export const useCreateAppointment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateAppointmentData) => agendaService.createAppointment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agenda', 'week'] });
        },
    });
};
