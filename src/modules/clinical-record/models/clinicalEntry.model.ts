import mongoose, { Schema, Document, Types } from 'mongoose';
import { tenantPlugin } from '@shared/plugins/tenant.plugin';
import { auditPlugin } from '@shared/plugins/audit.plugin';
import { EncryptedField } from '@shared/utils/encryption';

export interface IClinicalEntry extends Document {
    tenantId: string;
    patientId: Types.ObjectId;
    entryDate: Date;
    entryType: string;
    content: {
        /** Encrypted via AES-256-GCM — NEVER accessible by IA */
        sessionNotes_encrypted?: EncryptedField;
        objectives?: string;
        interventionType?: string;
        emotionalState?: string;
        riskAssessment?: string;
        diagnosis_encrypted?: EncryptedField;
        medication_encrypted?: EncryptedField;
        privateNotes_encrypted?: EncryptedField;
    };
    duration?: number;
    appointmentId?: Types.ObjectId;
    isPrivate: boolean;
    iaAccessible: boolean;
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
}

const EncryptedFieldSchema = new Schema(
    {
        iv: { type: String, required: true },
        data: { type: String, required: true },
        tag: { type: String, required: true },
    },
    { _id: false }
);

const ClinicalEntrySchema = new Schema<IClinicalEntry>(
    {
        patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
        entryDate: { type: Date, required: true, default: Date.now },
        entryType: {
            type: String,
            required: true,
            enum: ['session', 'initial_evaluation', 'follow_up', 'discharge', 'supervision_note', 'interconsultation'],
        },
        content: {
            sessionNotes_encrypted: EncryptedFieldSchema,
            objectives: { type: String, maxlength: 2000 },
            interventionType: {
                type: String,
                enum: ['CBT', 'psychodynamic', 'systemic', 'humanistic', 'integrative', 'EMDR', 'other'],
            },
            emotionalState: { type: String, maxlength: 500 },
            riskAssessment: {
                type: String,
                enum: ['none', 'low', 'medium', 'high', 'critical'],
            },
            diagnosis_encrypted: EncryptedFieldSchema,
            medication_encrypted: EncryptedFieldSchema,
            privateNotes_encrypted: EncryptedFieldSchema,
        },
        duration: { type: Number, min: 1, max: 480 }, // minutes
        appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
        isPrivate: { type: Boolean, default: false },
        iaAccessible: { type: Boolean, default: false }, // ALWAYS false — IA cannot access clinical data
    },
    { timestamps: true }
);

ClinicalEntrySchema.plugin(tenantPlugin);
ClinicalEntrySchema.plugin(auditPlugin);

ClinicalEntrySchema.index({ tenantId: 1, patientId: 1, entryDate: -1 });
ClinicalEntrySchema.index({ tenantId: 1, patientId: 1, entryType: 1 });
ClinicalEntrySchema.index({ tenantId: 1, createdBy: 1 });
ClinicalEntrySchema.index({ tenantId: 1, appointmentId: 1 });

// Security guard: ensure iaAccessible is ALWAYS false
ClinicalEntrySchema.pre('save', function () {
    if (this.iaAccessible) {
        this.iaAccessible = false;
    }
});

export default mongoose.model<IClinicalEntry>('ClinicalEntry', ClinicalEntrySchema);
