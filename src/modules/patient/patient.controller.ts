import { Response, NextFunction } from 'express';
import { IAuthRequest } from '@shared/types';
import { patientService } from './patient.service';
import { sendSuccess, sendCreated, sendNoContent } from '@shared/utils/apiResponse';

export class PatientController {
    async create(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const patient = await patientService.create(req.tenantId!, req.body, req.user!._id);
            sendCreated(res, patient);
        } catch (error) { next(error); }
    }

    async getById(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const patient = await patientService.getById(req.tenantId!, req.params.id as string);
            sendSuccess(res, patient);
        } catch (error) { next(error); }
    }

    async list(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await patientService.list(req.tenantId!, req.query);
            res.json({ status: 'success', ...result });
        } catch (error) { next(error); }
    }

    async update(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const patient = await patientService.update(req.tenantId!, req.params.id as string, req.body, req.user!._id);
            sendSuccess(res, patient);
        } catch (error) { next(error); }
    }

    async remove(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            await patientService.softDelete(req.tenantId!, req.params.id as string, req.user!._id);
            sendNoContent(res);
        } catch (error) { next(error); }
    }
}

export const patientController = new PatientController();
