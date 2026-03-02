import mongoose, { Schema, Document, Types } from 'mongoose';
import { tenantPlugin } from '@shared/plugins/tenant.plugin';

export interface IConsentTemplate extends Document {
    tenantId: string;
    documentType: string;
    currentVersion: number;
    title: string;
    content: string;
    isActive: boolean;
    changelog: Array<{
        version: number;
        changedBy?: Types.ObjectId;
        changedAt: Date;
        summary?: string;
    }>;
}

const ConsentTemplateSchema = new Schema<IConsentTemplate>(
    {
        documentType: {
            type: String,
            required: true,
            enum: [
                'tratamiento_clinico', 'datos_personales', 'teleconsulta',
                'grabacion_sesion', 'interconsulta', 'menores',
                'investigacion', 'politica_privacidad', 'custom',
            ],
        },
        currentVersion: { type: Number, default: 1 },
        title: { type: String, required: true, maxlength: 300, trim: true },
        content: { type: String, required: true },
        isActive: { type: Boolean, default: true },
        changelog: [
            {
                version: Number,
                changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
                changedAt: { type: Date, default: Date.now },
                summary: { type: String, maxlength: 500 },
            },
        ],
    },
    { timestamps: true }
);

ConsentTemplateSchema.plugin(tenantPlugin);
ConsentTemplateSchema.index({ tenantId: 1, documentType: 1 }, { unique: true });

export default mongoose.model<IConsentTemplate>('ConsentTemplate', ConsentTemplateSchema);
