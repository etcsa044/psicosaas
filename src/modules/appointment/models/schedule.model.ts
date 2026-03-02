import mongoose, { Schema, Document, Types } from 'mongoose';
import { tenantPlugin } from '@shared/plugins/tenant.plugin';

export interface ISchedule extends Document {
  tenantId: string;
  professionalId: Types.ObjectId;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
  blockedSlots: Array<{
    date: Date;
    startTime: string;
    endTime: string;
    reason?: string;
  }>;
  vacations: Array<{
    startDate: Date;
    endDate: Date;
    reason?: string;
  }>;
}

const ScheduleSchema = new Schema<ISchedule>(
  {
    professionalId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true, match: /^([01]\d|2[0-3]):([0-5]\d)$/ },
    endTime: { type: String, required: true, match: /^([01]\d|2[0-3]):([0-5]\d)$/ },
    slotDuration: { type: Number, default: 50, min: 15, max: 120 },
    isActive: { type: Boolean, default: true },
    blockedSlots: [
      {
        date: { type: Date, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        reason: { type: String, maxlength: 200 },
      },
    ],
    vacations: [
      {
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        reason: { type: String, maxlength: 200 },
      },
    ],
  },
  { timestamps: true }
);

ScheduleSchema.plugin(tenantPlugin);

ScheduleSchema.index({ tenantId: 1, professionalId: 1, dayOfWeek: 1 }, { unique: true });
ScheduleSchema.index({ tenantId: 1, professionalId: 1, isActive: 1 });

export default mongoose.model<ISchedule>('Schedule', ScheduleSchema);
