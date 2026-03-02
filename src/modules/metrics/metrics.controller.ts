import { Response, NextFunction } from 'express';
import { IAuthRequest } from '@shared/types';
import { metricsService } from './metrics.service';
import { sendSuccess } from '@shared/utils/apiResponse';

export class MetricsController {
    async getCurrentMonth(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const now = new Date();
            const metrics = await metricsService.getMetrics(req.tenantId!, now.getFullYear(), now.getMonth() + 1);
            sendSuccess(res, metrics);
        } catch (error) { next(error); }
    }

    async getByPeriod(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const year = parseInt(req.query.year as string);
            const month = parseInt(req.query.month as string);
            const metrics = await metricsService.getMetrics(req.tenantId!, year, month);
            sendSuccess(res, metrics);
        } catch (error) { next(error); }
    }

    async getRange(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const months = parseInt(req.query.months as string) || 6;
            const now = new Date();
            let startMonth = now.getMonth() + 1 - months + 1;
            let startYear = now.getFullYear();
            if (startMonth <= 0) { startMonth += 12; startYear--; }
            const metrics = await metricsService.getMetricsRange(req.tenantId!, startYear, startMonth, months);
            sendSuccess(res, metrics);
        } catch (error) { next(error); }
    }

    async recalculate(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const year = parseInt(req.body.year);
            const month = parseInt(req.body.month);
            const metrics = await metricsService.calculateMonthlyMetrics(req.tenantId!, year, month);
            sendSuccess(res, metrics);
        } catch (error) { next(error); }
    }
}

export const metricsController = new MetricsController();
