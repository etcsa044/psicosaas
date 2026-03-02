import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoice extends Document {
    tenantId: string;
    subscriptionId: mongoose.Types.ObjectId;
    invoiceNumber: string;
    amount: number;
    currency: string;
    status: string;
    issuedAt: Date;
    dueDate: Date;
    paidAt?: Date;
    externalPaymentId?: string;
    description: string;
}

const InvoiceSchema = new Schema<IInvoice>(
    {
        tenantId: { type: String, required: true },
        subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription', required: true },
        invoiceNumber: { type: String, required: true, unique: true },
        amount: { type: Number, required: true, min: 0 },
        currency: { type: String, default: 'ARS' },
        status: {
            type: String,
            enum: ['draft', 'issued', 'paid', 'overdue', 'cancelled', 'refunded'],
            default: 'issued',
        },
        issuedAt: { type: Date, required: true, default: Date.now },
        dueDate: { type: Date, required: true },
        paidAt: { type: Date },
        externalPaymentId: { type: String },
        description: { type: String, required: true },
    },
    { timestamps: true }
);

InvoiceSchema.index({ tenantId: 1, status: 1 });
InvoiceSchema.index({ tenantId: 1, issuedAt: -1 });

export default mongoose.model<IInvoice>('Invoice', InvoiceSchema);
