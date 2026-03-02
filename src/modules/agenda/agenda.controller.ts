import { Response, NextFunction } from 'express';
import { sendSuccess } from '@shared/utils/apiResponse';
import * as agendaService from './agenda.service';
import { Types } from 'mongoose';
import { IAuthRequest } from '@shared/types';

export class AgendaController {
    async getWeeklyAgenda(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const { tenantId, user } = req;
            const { start } = req.query;

            if (!start || typeof start !== 'string') {
                throw new Error('Query parameter "start" (ISODate) is required');
            }

            const startDateUTC = new Date(start);
            if (isNaN(startDateUTC.getTime())) {
                throw new Error('Invalid start date format. Must be ISO Date');
            }

            const agenda = await agendaService.generateWeeklySlots(
                tenantId!,
                new Types.ObjectId(user!._id),
                startDateUTC
            );

            sendSuccess(res, agenda);
        } catch (error) { next(error); }
    }

    async createAppointment(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const { tenantId, user } = req;
            const { patientId, startAt, endAt, duration, type, modality, notes, isRecurring, recurringPattern, overrideFrequencyAlert } = req.body;

            const appointment = await agendaService.createAtomicAppointment(
                tenantId!,
                new Types.ObjectId(user!._id),
                {
                    patientId: new Types.ObjectId(patientId),
                    startAt: new Date(startAt),
                    endAt: new Date(endAt),
                    duration,
                    type,
                    modality,
                    notes,
                    isRecurring,
                    recurringPattern,
                    overrideFrequencyAlert
                }
            );

            sendSuccess(res, appointment, 201);
        } catch (error) { next(error); }
    }
}

export const agendaController = new AgendaController();
