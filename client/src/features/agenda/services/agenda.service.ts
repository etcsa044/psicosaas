import { api } from '../../../lib/axios';
import { WeekAgenda } from '../types/agenda.types';

export interface CreateAppointmentData {
    patientId: string;
    startAt: string; // ISO String mapping to Date in backend
    endAt: string;   // ISO String mapping to Date in backend
    overrideFrequencyAlert?: boolean;
}

export const agendaService = {
    async getWeeklyAgenda(startISO: string): Promise<WeekAgenda> {
        const response = await api.get<{ status: string, data: WeekAgenda }>('/agenda/week', {
            params: { start: startISO }
        });
        return response.data.data;
    },

    async createAppointment(data: CreateAppointmentData): Promise<void> {
        // Map frontend minimum drop payload to backend explicit requirement schema
        const payload = {
            ...data,
            duration: 50,
            type: 'regular_session', // Valid Enum value
            modality: 'video_call',  // Valid Enum value
            isRecurring: false,      // Single drop for now 
            overrideFrequencyAlert: data.overrideFrequencyAlert
        };
        await api.post('/agenda/appointment', payload);
    }
};
