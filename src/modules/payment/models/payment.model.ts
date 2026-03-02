import mongoose, { Schema, Document, Types } from 'mongoose';
import { tenantPlugin } from '@shared/plugins/tenant.plugin';
import { auditPlugin } from '@shared/plugins/audit.plugin';

export interface IPayment extends Document {
    tenantId: string;
    patientId: Types.ObjectId;
    appointmentId?: Types.ObjectId;
    amount: number;
    currency: string;
    method: string;
    status: string;
    paymentDate: Date;
    receiptNumber?: string;
    externalPaymentId?: string;
    notes?: string;
    insuranceCoverage?: {
        provider: string;
        authorizationCode?: string;
        coveredAmount: number;
        copay: number;
    };
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
}

const PaymentSchema = new Schema<IPayment>(
    {
        patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
        appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
        amount: { type: Number, required: true, min: 0 },
        currency: { type: String, default: 'ARS', maxlength: 3 },
        method: {
            type: String,
            required: true,
            enum: ['cash', 'transfer', 'debit_card', 'credit_card', 'mercado_pago', 'insurance', 'other'],
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'refunded', 'cancelled', 'partial'],
            default: 'completed',
        },
        paymentDate: { type: Date, required: true, default: Date.now },
        receiptNumber: { type: String, trim: true },
        externalPaymentId: { type: String },
        notes: { type: String, maxlength: 500 },
        insuranceCoverage: {
            provider: { type: String },
            authorizationCode: { type: String },
            coveredAmount: { type: Number, min: 0 },
            copay: { type: Number, min: 0 },
        },
    },
    { timestamps: true }
);

PaymentSchema.plugin(tenantPlugin);
PaymentSchema.plugin(auditPlugin);

PaymentSchema.index({ tenantId: 1, patientId: 1, paymentDate: -1 });
PaymentSchema.index({ tenantId: 1, status: 1 });
PaymentSchema.index({ tenantId: 1, method: 1 });
PaymentSchema.index({ tenantId: 1, appointmentId: 1 });
PaymentSchema.index({ tenantId: 1, paymentDate: -1 });

export default mongoose.model<IPayment>('Payment', PaymentSchema);
