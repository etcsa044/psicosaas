import { Response, NextFunction } from 'express';
import { IAuthRequest } from '@shared/types';
import { feedbackService } from './feedback.service';
import { sendCreated, sendSuccess } from '@shared/utils/apiResponse';

export class FeedbackController {
    async create(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const feedback = await feedbackService.create(
                req.tenantId!,
                req.user!._id,
                req.body
            );
            sendCreated(res, feedback);
        } catch (error) {
            next(error);
        }
    }

    async list(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const feedbacks = await feedbackService.list(req.tenantId!);
            sendSuccess(res, feedbacks);
        } catch (error) {
            next(error);
        }
    }
}

export const feedbackController = new FeedbackController();
