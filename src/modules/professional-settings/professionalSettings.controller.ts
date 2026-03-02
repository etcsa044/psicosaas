import { Response, NextFunction } from 'express';
import { IAuthRequest } from '@shared/types';
import { professionalSettingsService } from './professionalSettings.service';
import { sendSuccess } from '@shared/utils/apiResponse';

export class ProfessionalSettingsController {
    async getSettings(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const settings = await professionalSettingsService.getOrCreateSettings(req.tenantId!, req.user!._id);
            sendSuccess(res, settings);
        } catch (error) { next(error); }
    }

    async updateSettings(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const settings = await professionalSettingsService.updateSettings(req.tenantId!, req.user!._id, req.body);
            sendSuccess(res, settings);
        } catch (error) { next(error); }
    }
}

export const professionalSettingsController = new ProfessionalSettingsController();
