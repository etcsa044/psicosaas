import { Response, NextFunction } from 'express';
import { IAuthRequest } from '@shared/types';
import { paymentService } from './payment.service';
import { sendSuccess, sendCreated } from '@shared/utils/apiResponse';

export class PaymentController {
    async create(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const payment = await paymentService.create(req.tenantId!, req.body, req.user!._id);
            sendCreated(res, payment);
        } catch (error) { next(error); }
    }

    async getById(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const payment = await paymentService.getById(req.tenantId!, req.params.id as string);
            sendSuccess(res, payment);
        } catch (error) { next(error); }
    }

    async list(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const payments = await paymentService.listByDateRange(req.tenantId!, req.query);
            sendSuccess(res, payments);
        } catch (error) { next(error); }
    }

    async listByPatient(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await paymentService.listByPatient(req.tenantId!, req.params.patientId as string, req.query);
            res.json({ status: 'success', ...result });
        } catch (error) { next(error); }
    }

    async getBalance(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const balance = await paymentService.getPatientBalance(req.tenantId!, req.params.patientId as string);
            sendSuccess(res, balance);
        } catch (error) { next(error); }
    }

    async update(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const payment = await paymentService.update(req.tenantId!, req.params.id as string, req.body, req.user!._id);
            sendSuccess(res, payment);
        } catch (error) { next(error); }
    }

    async monthlyReport(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const year = parseInt(req.query.year as string) || new Date().getFullYear();
            const month = parseInt(req.query.month as string) || (new Date().getMonth() + 1);
            const report = await paymentService.getMonthlyReport(req.tenantId!, year, month);
            sendSuccess(res, report);
        } catch (error) { next(error); }
    }
}

export const paymentController = new PaymentController();
