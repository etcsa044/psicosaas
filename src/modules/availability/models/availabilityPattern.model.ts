import mongoose, { Schema, Document, Types } from 'mongoose';
import { tenantPlugin } from '@shared/plugins/tenant.plugin';
import { auditPlugin } from '@shared/plugins/audit.plugin';

export interface IAvailabilityPattern extends Document {
    tenantId: string;
    professionalId: Types.ObjectId;
    dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    startMinutes: number; // Minutes from midnight (e.g., 09:00 = 540)
    endMinutes: number; // Minutes from midnight
    slotDuration: number; // Default 50 mins
    bufferMinutes: number; // Default 10 mins (break between sessions)
    isDeleted: boolean; // Soft delete
}

const AvailabilityPatternSchema = new Schema<IAvailabilityPattern>(
    {
        professionalId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
        startMinutes: { type: Number, required: true, min: 0, max: 1440 },
        endMinutes: { type: Number, required: true, min: 0, max: 1440 },
        slotDuration: { type: Number, required: true, min: 10, max: 480, default: 50 },
        bufferMinutes: { type: Number, required: true, min: 0, max: 120, default: 5 },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

AvailabilityPatternSchema.plugin(tenantPlugin);
AvailabilityPatternSchema.plugin(auditPlugin);

// Core indexes for fast Slot generation
AvailabilityPatternSchema.index({ tenantId: 1, professionalId: 1, dayOfWeek: 1 });
AvailabilityPatternSchema.index({ tenantId: 1, dayOfWeek: 1 });

// Validate endMinutes > startMinutes
AvailabilityPatternSchema.pre('save', function () {
    if (this.endMinutes <= this.startMinutes) {
        throw new Error('endMinutes must be strictly greater than startMinutes');
    }
});

export default mongoose.model<IAvailabilityPattern>('AvailabilityPattern', AvailabilityPatternSchema);
