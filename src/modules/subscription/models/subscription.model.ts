import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
    tenantId: string;
    plan: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    cancelledAt?: Date;
    cancellationReason?: string;
    trialStart?: Date;
    trialEnd?: Date;
    paymentGateway: string;
    externalSubscriptionId?: string;
    externalCustomerId?: string;
    pricing: {
        amount: number;
        currency: string;
        interval: string;
    };
    paymentHistory: Array<{
        externalPaymentId: string;
        amount: number;
        status: string;
        paidAt: Date;
        gatewayResponse?: string;
    }>;
    suspendedAt?: Date;
    suspensionReason?: string;
    reactivatedAt?: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
    {
        tenantId: { type: String, required: true, unique: true },
        plan: {
            type: String,
            enum: ['free_trial', 'basic', 'professional', 'premium'],
            default: 'free_trial',
        },
        status: {
            type: String,
            enum: ['trialing', 'active', 'past_due', 'suspended', 'cancelled', 'expired'],
            default: 'trialing',
        },
        currentPeriodStart: { type: Date, required: true },
        currentPeriodEnd: { type: Date, required: true },
        cancelAtPeriodEnd: { type: Boolean, default: false },
        cancelledAt: { type: Date },
        cancellationReason: { type: String, maxlength: 500 },
        trialStart: { type: Date },
        trialEnd: { type: Date },
        paymentGateway: { type: String, enum: ['mercado_pago', 'stripe', 'manual'], default: 'mercado_pago' },
        externalSubscriptionId: { type: String },
        externalCustomerId: { type: String },
        pricing: {
            amount: { type: Number, required: true },
            currency: { type: String, default: 'ARS' },
            interval: { type: String, enum: ['monthly', 'quarterly', 'yearly'], default: 'monthly' },
        },
        paymentHistory: [
            {
                externalPaymentId: { type: String, required: true },
                amount: { type: Number, required: true },
                status: { type: String, enum: ['approved', 'rejected', 'pending', 'refunded'], required: true },
                paidAt: { type: Date, required: true },
                gatewayResponse: { type: String },
            },
        ],
        suspendedAt: { type: Date },
        suspensionReason: { type: String },
        reactivatedAt: { type: Date },
    },
    { timestamps: true }
);

SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ currentPeriodEnd: 1, status: 1 });
SubscriptionSchema.index({ externalSubscriptionId: 1 });

export default mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
