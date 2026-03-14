import { api } from '../../../lib/axios';
import { WeekAgenda } from '../types/agenda.types';

export interface CreateAppointmentData {
    patientId: string;
    startAt: string; // ISO String mapping to Date in backend
    endAt: string;   // ISO String mapping to Date in backend
    overrideFrequencyAlert?: boolean;
    recurringPattern?: any;
}

export const agendaService = {
    async getWeeklyAgenda(startISO: string, days?: number): Promise<WeekAgenda> {
        const response = await api.get<{ status: string, data: WeekAgenda }>('/agenda/week', {
            params: { start: startISO, days }
        });
        return response.data.data;
    },

    async createAppointment(data: CreateAppointmentData): Promise<any> {
        // Map frontend minimum drop payload to backend explicit requirement schema
        const payload: any = {
            ...data,
            duration: 50,
            type: 'regular_session', // Valid Enum value
            modality: 'video_call',  // Valid Enum value
            isRecurring: !!data.recurringPattern,
            overrideFrequencyAlert: data.overrideFrequencyAlert
        };

        if (data.recurringPattern) {
            payload.recurringPattern = data.recurringPattern;
            const response = await api.post('/appointments/recurring', payload);
            return response.data.data;
        } else {
            const response = await api.post('/appointments', payload);
            return response.data.data;
        }
    }
};
