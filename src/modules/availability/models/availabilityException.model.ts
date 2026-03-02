import mongoose, { Schema, Document, Types } from 'mongoose';
import { tenantPlugin } from '@shared/plugins/tenant.plugin';
import { auditPlugin } from '@shared/plugins/audit.plugin';

export interface IAvailabilityException extends Document {
    tenantId: string;
    professionalId: Types.ObjectId;
    date: Date; // Important: Saved as strictly UTC 00:00:00 of the specific day
    blocked: boolean; // True if it's a full day off (vacation, holiday)
    customSlots?: Array<{
        startMinutes: number;
        endMinutes: number;
    }>; // Optional custom schedule for this specific day
    reason?: string;
    isDeleted: boolean;
}

const AvailabilityExceptionSchema = new Schema<IAvailabilityException>(
    {
        professionalId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        date: { type: Date, required: true },
        blocked: { type: Boolean, default: true },
        customSlots: [
            {
                startMinutes: { type: Number, min: 0, max: 1440 },
                endMinutes: { type: Number, min: 0, max: 1440 },
            },
        ],
        reason: { type: String, maxlength: 250 },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

AvailabilityExceptionSchema.plugin(tenantPlugin);
AvailabilityExceptionSchema.plugin(auditPlugin);

// The Core Index for fast week range filtering
AvailabilityExceptionSchema.index({ tenantId: 1, professionalId: 1, date: 1 });
AvailabilityExceptionSchema.index({ tenantId: 1, date: 1 });

export default mongoose.model<IAvailabilityException>('AvailabilityException', AvailabilityExceptionSchema);
