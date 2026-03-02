import mongoose, { Schema, Document } from 'mongoose';

export interface ITenantMetrics extends Document {
    tenantId: string;
    period: { year: number; month: number };
    patients: {
        total: number;
        active: number;
        new: number;
        discharged: number;
    };
    appointments: {
        total: number;
        completed: number;
        cancelled: number;
        noShow: number;
        avgDuration: number;
        completionRate: number;
    };
    financial: {
        totalRevenue: number;
        totalPayments: number;
        collectRate: number;
        avgSessionPrice: number;
        byMethod: Record<string, number>;
    };
    bot: {
        totalMessages: number;
        escalations: number;
        taskCompletionRate: number;
        avgResponseTimeMs: number;
    };
    calculatedAt: Date;
}

const TenantMetricsSchema = new Schema<ITenantMetrics>(
    {
        tenantId: { type: String, required: true },
        period: {
            year: { type: Number, required: true },
            month: { type: Number, required: true, min: 1, max: 12 },
        },
        patients: {
            total: { type: Number, default: 0 },
            active: { type: Number, default: 0 },
            new: { type: Number, default: 0 },
            discharged: { type: Number, default: 0 },
        },
        appointments: {
            total: { type: Number, default: 0 },
            completed: { type: Number, default: 0 },
            cancelled: { type: Number, default: 0 },
            noShow: { type: Number, default: 0 },
            avgDuration: { type: Number, default: 0 },
            completionRate: { type: Number, default: 0 },
        },
        financial: {
            totalRevenue: { type: Number, default: 0 },
            totalPayments: { type: Number, default: 0 },
            collectRate: { type: Number, default: 0 },
            avgSessionPrice: { type: Number, default: 0 },
            byMethod: { type: Schema.Types.Mixed, default: {} },
        },
        bot: {
            totalMessages: { type: Number, default: 0 },
            escalations: { type: Number, default: 0 },
            taskCompletionRate: { type: Number, default: 0 },
            avgResponseTimeMs: { type: Number, default: 0 },
        },
        calculatedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

TenantMetricsSchema.index({ tenantId: 1, 'period.year': 1, 'period.month': 1 }, { unique: true });

export default mongoose.model<ITenantMetrics>('TenantMetrics', TenantMetricsSchema);
