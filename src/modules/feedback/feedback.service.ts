import Feedback, { IFeedback } from './models/feedback.model';
import { Types } from 'mongoose';

class FeedbackService {
    async create(tenantId: string, userId: Types.ObjectId, input: {
        type: string;
        message: string;
        page: string;
        metadata?: { browser?: string; viewport?: string };
    }): Promise<IFeedback> {
        return Feedback.create({
            tenantId,
            userId,
            type: input.type,
            message: input.message,
            page: input.page,
            metadata: input.metadata,
            status: 'new',
        });
    }

    async list(tenantId: string): Promise<IFeedback[]> {
        return Feedback.find({ tenantId })
            .sort({ createdAt: -1 })
            .limit(100)
            .populate('userId', 'email profile.firstName profile.lastName')
            .lean() as Promise<IFeedback[]>;
    }
}

export const feedbackService = new FeedbackService();
