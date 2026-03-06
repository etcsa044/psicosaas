import mongoose, { Schema, Document, Types } from 'mongoose';
import { tenantPlugin } from '@shared/plugins/tenant.plugin';

export interface IFeedback extends Document {
    tenantId: string;
    userId: Types.ObjectId;
    type: 'bug' | 'improvement' | 'idea' | 'other';
    message: string;
    page: string;
    status: 'new' | 'reviewed' | 'planned' | 'resolved';
    metadata?: {
        browser?: string;
        viewport?: string;
    };
    createdAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        type: { type: String, enum: ['bug', 'improvement', 'idea', 'other'], required: true },
        message: { type: String, required: true, maxlength: 2000 },
        page: { type: String, required: true },
        status: { type: String, enum: ['new', 'reviewed', 'planned', 'resolved'], default: 'new' },
        metadata: {
            browser: { type: String },
            viewport: { type: String },
        },
    },
    { timestamps: true }
);

FeedbackSchema.plugin(tenantPlugin);

FeedbackSchema.index({ tenantId: 1, createdAt: -1 });

export default mongoose.model<IFeedback>('Feedback', FeedbackSchema);
