import mongoose, { Schema, Document, Types } from 'mongoose';
import { tenantPlugin } from '@shared/plugins/tenant.plugin';
import { auditPlugin } from '@shared/plugins/audit.plugin';

export interface IWeeklyFrequencyPolicy {
    mode: 'none' | 'alert' | 'block';
    maxPerWeek?: number;
}

export interface IProfessionalSettings extends Document {
    tenantId: string;
    professionalId: Types.ObjectId;
    defaultRules: {
        weeklyFrequencyPolicy: IWeeklyFrequencyPolicy;
        appointmentDurationMinutes: number;
        cancellationAlertThreshold?: number;
        cancellationAlertWindowDays?: number;
    };
    patientTypeOverrides: Map<string, { weeklyFrequencyPolicy: IWeeklyFrequencyPolicy }>;
}

const WeeklyFrequencyPolicySchema = new Schema<IWeeklyFrequencyPolicy>({
    mode: { type: String, enum: ['none', 'alert', 'block'], required: true },
    maxPerWeek: {
        type: Number,
        min: 1,
        required: function (this: IWeeklyFrequencyPolicy) { return this.mode !== 'none'; }
    }
}, { _id: false });

const ProfessionalSettingsSchema = new Schema<IProfessionalSettings>(
    {
        professionalId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        defaultRules: {
            weeklyFrequencyPolicy: { type: WeeklyFrequencyPolicySchema, required: true },
            appointmentDurationMinutes: { type: Number, enum: [30, 45, 60, 90], default: 45 },
            cancellationAlertThreshold: { type: Number, min: 1, default: null },
            cancellationAlertWindowDays: { type: Number, min: 1, max: 365, default: 30 }
        },
        patientTypeOverrides: {
            type: Map,
            of: new Schema({
                weeklyFrequencyPolicy: { type: WeeklyFrequencyPolicySchema, required: true }
            }, { _id: false }),
            default: {}
        }
    },
    { timestamps: true }
);

ProfessionalSettingsSchema.plugin(tenantPlugin);
ProfessionalSettingsSchema.plugin(auditPlugin);

// Ensure index for fast lookup per tenant & professional
ProfessionalSettingsSchema.index({ tenantId: 1, professionalId: 1 }, { unique: true });

export default mongoose.model<IProfessionalSettings>('ProfessionalSettings', ProfessionalSettingsSchema);
