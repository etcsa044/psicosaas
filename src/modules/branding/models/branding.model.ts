import mongoose, { Schema, Document } from 'mongoose';

export interface IBranding extends Document {
    tenantId: string;
    logoUrl?: string;
    primaryColor: string;
    secondaryColor: string;
    nombrePublico: string;
    mensajeRecordatorioPersonalizado: string;
    firmaWhatsApp: string;
    nombreDelBot: string;
    tonoDelBot: string;
}

const BrandingSchema = new Schema<IBranding>(
    {
        tenantId: { type: String, required: true, unique: true },
        logoUrl: { type: String },
        primaryColor: {
            type: String,
            default: '#4A90D9',
            match: [/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'],
        },
        secondaryColor: {
            type: String,
            default: '#2C3E50',
            match: [/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'],
        },
        nombrePublico: { type: String, maxlength: 200, default: '' },
        mensajeRecordatorioPersonalizado: {
            type: String,
            maxlength: 500,
            default: 'Te recordamos tu turno programado. ¡Te esperamos!',
        },
        firmaWhatsApp: { type: String, maxlength: 200, default: '' },
        nombreDelBot: { type: String, default: 'Asistente Virtual', maxlength: 100 },
        tonoDelBot: {
            type: String,
            enum: ['formal', 'calido', 'neutro'],
            default: 'neutro',
        },
    },
    { timestamps: true }
);

export default mongoose.model<IBranding>('Branding', BrandingSchema);
