import { Response, NextFunction } from 'express';
import { IAuthRequest } from '@shared/types';
import { recurringAppointmentService, CreateRecurringSeriesInput } from './recurringAppointment.service';
import { sendSuccess, sendCreated } from '@shared/utils/apiResponse';
import { Types } from 'mongoose';

export class RecurringAppointmentController {
    async create(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const input: CreateRecurringSeriesInput = {
                tenantId: req.tenantId!,
                userId: req.user!._id,
                ...req.body
            };
            const result = await recurringAppointmentService.createSeries(input);
            sendCreated(res, result);
        } catch (error) { next(error); }
    }

    async modifySingle(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            await recurringAppointmentService.modifySingle(
                req.tenantId!,
                req.params.id as string,
                req.body,
                req.user!._id
            );
            sendSuccess(res, { message: 'Single occurrence modified successfully' });
        } catch (error) { next(error); }
    }

    async modifyFromHere(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await recurringAppointmentService.modifyFromHere(
                req.tenantId!,
                req.params.id as string,
                req.body,
                req.user!._id
            );
            sendSuccess(res, result);
        } catch (error) { next(error); }
    }

    async modifyAll(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await recurringAppointmentService.modifyAll(
                req.tenantId!,
                req.params.id as string,
                req.body,
                req.user!._id
            );
            sendSuccess(res, result);
        } catch (error) { next(error); }
    }

    async cancelSeries(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            await recurringAppointmentService.cancelSeries(
                req.tenantId!,
                req.params.id as string,
                req.body.source || 'PROFESSIONAL',
                req.body.reason || 'Serie cancelada por el profesional',
                req.user!._id
            );
            sendSuccess(res, { message: 'Series cancelled successfully' });
        } catch (error) { next(error); }
    }
}

export const recurringAppointmentController = new RecurringAppointmentController();
