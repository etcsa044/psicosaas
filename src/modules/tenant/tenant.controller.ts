import { Response, NextFunction } from 'express';
import { IAuthRequest } from '@shared/types';
import { tenantService } from './tenant.service';
import { sendSuccess } from '@shared/utils/apiResponse';

export class TenantController {
    async getMyTenant(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const tenant = await tenantService.getTenantById(req.tenantId!);
            sendSuccess(res, tenant);
        } catch (error) { next(error); }
    }

    async updateMyTenant(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const tenant = await tenantService.updateTenant(req.tenantId!, req.body);
            sendSuccess(res, tenant);
        } catch (error) { next(error); }
    }
}

export const tenantController = new TenantController();
