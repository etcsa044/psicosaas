import { Response, NextFunction } from 'express';
import { IAuthRequest } from '@shared/types';
import { clinicalRecordService } from './clinicalRecord.service';
import { sendSuccess, sendCreated } from '@shared/utils/apiResponse';

export class ClinicalRecordController {
    async create(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const entry = await clinicalRecordService.create(req.tenantId!, req.body, req.user!._id);
            sendCreated(res, entry);
        } catch (error) { next(error); }
    }

    async getById(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const entry = await clinicalRecordService.getById(req.tenantId!, req.params.id as string);
            sendSuccess(res, entry);
        } catch (error) { next(error); }
    }

    async getByPatient(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await clinicalRecordService.getByPatient(
                req.tenantId!, req.params.patientId as string, req.query
            );
            res.json({ status: 'success', ...result });
        } catch (error) { next(error); }
    }

    async update(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const entry = await clinicalRecordService.update(
                req.tenantId!, req.params.id as string, req.body, req.user!._id
            );
            sendSuccess(res, entry);
        } catch (error) { next(error); }
    }
}

export const clinicalRecordController = new ClinicalRecordController();
