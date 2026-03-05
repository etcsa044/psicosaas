import { Response, NextFunction } from 'express';
import { IAuthRequest } from '@shared/types';
import { appointmentService } from './appointment.service';
import { sendSuccess, sendCreated, sendNoContent } from '@shared/utils/apiResponse';

export class AppointmentController {
    // ── Appointments ──
    async create(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const appointment = await appointmentService.create(req.tenantId!, req.body, req.user!._id);
            sendCreated(res, appointment);
        } catch (error) { next(error); }
    }

    async getById(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const appointment = await appointmentService.getById(req.tenantId!, req.params.id as string);
            sendSuccess(res, appointment);
        } catch (error) { next(error); }
    }

    async list(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const appointments = await appointmentService.listByDateRange(req.tenantId!, req.query);
            sendSuccess(res, appointments);
        } catch (error) { next(error); }
    }

    async update(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const appointment = await appointmentService.update(req.tenantId!, req.params.id as string, req.body, req.user!._id);
            sendSuccess(res, appointment);
        } catch (error) { next(error); }
    }

    async updateStatus(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const appointment = await appointmentService.updateStatus(
                req.tenantId!, req.params.id as string, req.body.status, req.user!._id, req.body.reason
            );
            sendSuccess(res, appointment);
        } catch (error) { next(error); }
    }

    async cancel(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const appointment = await appointmentService.cancelAppointment(
                req.tenantId!,
                req.params.id as string,
                req.user!._id,
                req.body?.source || 'PROFESSIONAL',
                req.body?.reason
            );
            sendSuccess(res, appointment);
        } catch (error) { next(error); }
    }

    async delete(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            // Clinical cancellation (status → cancelled), NOT soft delete
            await appointmentService.cancelAppointment(
                req.tenantId!,
                req.params.id as string,
                req.user!._id,
                req.body?.source || 'PROFESSIONAL',
                req.body?.reason || 'Cancelled by user'
            );
            sendSuccess(res, { success: true });
        } catch (error) { next(error); }
    }

    async reschedule(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const appointment = await appointmentService.reschedule(
                req.tenantId!, req.params.id as string, req.body.newStartUTC, req.user!._id, req.body.overrideFrequencyAlert
            );
            sendSuccess(res, appointment);
        } catch (error) { next(error); }
    }

    // ── Availability ──
    async getAvailableSlots(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const slots = await appointmentService.getAvailableSlots(
                req.tenantId!, req.query.professionalId as string, req.query.date as string
            );
            sendSuccess(res, slots);
        } catch (error) { next(error); }
    }

    // ── Schedule ──
    async getSchedule(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const schedule = await appointmentService.getSchedule(req.tenantId!, req.params.professionalId as string);
            sendSuccess(res, schedule);
        } catch (error) { next(error); }
    }

    async upsertSchedule(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const schedule = await appointmentService.upsertSchedule(req.tenantId!, req.user!._id.toString(), req.body);
            sendSuccess(res, schedule);
        } catch (error) { next(error); }
    }

    async blockSlot(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const schedule = await appointmentService.blockSlot(req.tenantId!, req.user!._id.toString(), req.body);
            sendSuccess(res, schedule);
        } catch (error) { next(error); }
    }

    async addVacation(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            await appointmentService.addVacation(req.tenantId!, req.user!._id.toString(), req.body);
            sendSuccess(res, { message: 'Vacation added successfully' });
        } catch (error) { next(error); }
    }
}

export const appointmentController = new AppointmentController();
