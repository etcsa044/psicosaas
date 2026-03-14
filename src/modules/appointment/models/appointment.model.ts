import mongoose, { Schema, Document, Types } from 'mongoose';
import { tenantPlugin } from '@shared/plugins/tenant.plugin';
import { softDeletePlugin } from '@shared/plugins/softDelete.plugin';
import { auditPlugin } from '@shared/plugins/audit.plugin';

export interface IAppointment extends Document {
    tenantId: string;
    patientId: Types.ObjectId;
    professionalId: Types.ObjectId;
    startAt: Date; // UTC
    endAt: Date; // UTC
    duration: number;
    status: string;
    type: string;
    modality: string;
    meetingUrl?: string;
    location?: string;
    reason?: string;
    notes?: string;
    cancelledAt?: Date;
    cancelledBy?: Types.ObjectId;
    cancellationReason?: string;
    cancellationSource?: 'PATIENT' | 'PROFESSIONAL' | 'SYSTEM';
    isRecurring: boolean;
    recurringPattern?: {
        frequency: string;
        dayOfWeek?: number;
        interval?: number;
        parentAppointmentId?: Types.ObjectId;
        seriesEndMaterializedAt?: Date; // Limit for materialized recurrence expansion
        seriesEndDate?: Date;
        monthlyMode?: 'same_date' | 'same_weekday_position';
    };
    reminders: Array<{
        type: string;
        sentAt?: Date;
        status: string;
        scheduledFor: Date;
    }>;
    isDeleted: boolean;
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
}

const AppointmentSchema = new Schema<IAppointment>(
    {
        patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
        professionalId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        startAt: { type: Date, required: true },
        endAt: { type: Date, required: true },
        duration: { type: Number, required: true, min: 15, max: 480 },
        status: {
            type: String,
            enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'pending_confirmation'],
            default: 'scheduled',
        },
        type: {
            type: String,
            enum: ['initial_evaluation', 'regular_session', 'follow_up', 'emergency', 'group_session'],
            default: 'regular_session',
        },
        modality: {
            type: String,
            enum: ['in_person', 'video_call', 'phone_call'],
            default: 'in_person',
        },
        meetingUrl: { type: String },
        location: { type: String, maxlength: 300 },
        reason: { type: String, maxlength: 500 },
        notes: { type: String, maxlength: 2000 },
        cancelledAt: { type: Date },
        cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
        cancellationReason: { type: String, maxlength: 500 },
        cancellationSource: { type: String, enum: ['PATIENT', 'PROFESSIONAL', 'SYSTEM'] },
        isRecurring: { type: Boolean, default: false },
        recurringPattern: {
            frequency: { type: String, enum: ['weekly', 'biweekly', 'monthly'] },
            dayOfWeek: { type: Number, min: 0, max: 6 },
            interval: { type: Number, min: 1, max: 12 },
            parentAppointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
            seriesEndMaterializedAt: { type: Date },
            seriesEndDate: { type: Date },
            monthlyMode: { type: String, enum: ['same_date', 'same_weekday_position'] },
        },
        reminders: [
            {
                type: { type: String, enum: ['whatsapp', 'email', 'sms', 'push'], default: 'whatsapp' },
                sentAt: Date,
                status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
                scheduledFor: { type: Date, required: true },
            },
        ],
    },
    { timestamps: true }
);

AppointmentSchema.plugin(tenantPlugin);
AppointmentSchema.plugin(softDeletePlugin);
AppointmentSchema.plugin(auditPlugin);

// Optimized Indexes according to DB Prompt Phase 2 Core Engine
AppointmentSchema.index({ tenantId: 1, startAt: 1, endAt: 1 });
AppointmentSchema.index({ tenantId: 1, patientId: 1, startAt: -1 }); // Phase 7: patient history + stats (descending for recent-first)
AppointmentSchema.index({ tenantId: 1, professionalId: 1, startAt: 1, status: 1 });
AppointmentSchema.index({ 'recurringPattern.parentAppointmentId': 1 }); // Essential for Series modification
AppointmentSchema.index({ tenantId: 1, status: 1 });
AppointmentSchema.index({ tenantId: 1, patientId: 1, status: 1, cancelledAt: -1 }); // Phase 6: cancellation alert queries
AppointmentSchema.index({ 'reminders.scheduledFor': 1, 'reminders.status': 1 });

// Validate endAt > startAt
AppointmentSchema.pre('save', function () {
    if (this.endAt <= this.startAt) {
        throw new Error('endAt must be after startAt');
    }
});

export default mongoose.model<IAppointment>('Appointment', AppointmentSchema);
