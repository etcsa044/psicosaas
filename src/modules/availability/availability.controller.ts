import { Response, NextFunction } from 'express';
import { IAuthRequest } from '@shared/types';
import { availabilityService } from './availability.service';

export const availabilityController = {
    async getPatterns(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const tenantId = req.tenantId!;
            const professionalId = req.user!._id;

            const patterns = await availabilityService.getPatterns(tenantId, professionalId);
            res.status(200).json({ status: 'success', data: patterns });
        } catch (error) {
            next(error);
        }
    },

    async updatePatterns(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const tenantId = req.tenantId!;
            const professionalId = req.user!._id;
            const { patterns } = req.body;

            if (!Array.isArray(patterns)) {
                return res.status(400).json({ status: 'error', message: 'patterns must be an array' });
            }

            const updated = await availabilityService.updatePatterns(tenantId, professionalId, patterns);
            res.status(200).json({ status: 'success', data: updated });
        } catch (error) {
            next(error);
        }
    },

    async getExceptions(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const tenantId = req.tenantId!;
            const professionalId = req.user!._id;
            
            const { startDate, endDate } = req.query;
            let start, end;
            if (startDate) start = new Date(startDate as string);
            if (endDate) end = new Date(endDate as string);

            const exceptions = await availabilityService.getExceptions(tenantId, professionalId, start, end);
            res.status(200).json({ status: 'success', data: exceptions });
        } catch (error) {
            next(error);
        }
    },

    async setException(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const tenantId = req.tenantId!;
            const professionalId = req.user!._id;
            const { date, blocked, reason, customSlots } = req.body;

            if (!date || typeof blocked !== 'boolean') {
                return res.status(400).json({ status: 'error', message: 'date and blocked boolean are required' });
            }

            const parsedDate = new Date(date);
            const exception = await availabilityService.setException(tenantId, professionalId, parsedDate, blocked, reason, customSlots);
            
            res.status(200).json({ status: 'success', data: exception });
        } catch (error) {
            if (error instanceof Error && error.message.includes('CONFLICT:')) {
                return res.status(409).json({ status: 'error', message: error.message.replace('CONFLICT: ', '') });
            }
            next(error);
        }
    },

    async removeException(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const tenantId = req.tenantId!;
            const professionalId = req.user!._id;
            const { id } = req.params;

            await availabilityService.removeException(tenantId, professionalId, id as string);
            res.status(200).json({ status: 'success', message: 'Exception removed' });
        } catch (error) {
            if (error instanceof Error && error.message.includes('not found')) {
                return res.status(404).json({ status: 'error', message: error.message });
            }
            next(error);
        }
    }
};
