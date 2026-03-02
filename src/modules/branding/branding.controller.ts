import { Response, NextFunction } from 'express';
import { IAuthRequest } from '@shared/types';
import { brandingService } from './branding.service';
import { sendSuccess } from '@shared/utils/apiResponse';

export class BrandingController {
    async getBranding(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const branding = await brandingService.getBrandingByTenant(req.tenantId!);
            sendSuccess(res, branding);
        } catch (error) { next(error); }
    }

    async updateBranding(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const branding = await brandingService.updateBranding(req.tenantId!, req.body);
            sendSuccess(res, branding);
        } catch (error) { next(error); }
    }
}

export const brandingController = new BrandingController();
