import mongoose, { Schema, Document, Types } from 'mongoose';
import { tenantPlugin } from '@shared/plugins/tenant.plugin';

export interface IConsentDocument extends Document {
    tenantId: string;
    patientId: Types.ObjectId;
    documentType: string;
    customTypeName?: string;
    version: number;
    contentSnapshot: string;
    documentHash: string;
    acceptedAt: Date;
    acceptanceMethod: string;
    signatureData?: string;
    ipAddress: string;
    userAgent: string;
    geolocation?: { latitude?: number; longitude?: number };
    status: string;
    supersededBy?: Types.ObjectId;
    revokedAt?: Date;
    revokedReason?: string;
    auditTrail: Array<{
        action: string;
        performedBy?: Types.ObjectId;
        performedAt: Date;
        ipAddress?: string;
        details?: string;
    }>;
}

const ConsentDocumentSchema = new Schema<IConsentDocument>(
    {
        patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
        documentType: {
            type: String,
            required: true,
            enum: [
                'tratamiento_clinico', 'datos_personales', 'teleconsulta',
                'grabacion_sesion', 'interconsulta', 'menores',
                'investigacion', 'politica_privacidad', 'custom',
            ],
        },
        customTypeName: { type: String, maxlength: 200 },
        version: { type: Number, required: true, min: 1 },
        contentSnapshot: { type: String, required: true },
        documentHash: { type: String, required: true },
        acceptedAt: { type: Date, required: true },
        acceptanceMethod: {
            type: String,
            required: true,
            enum: ['firma_digital', 'checkbox_validado', 'firma_holografa_scan', 'doble_factor'],
        },
        signatureData: { type: String },
        ipAddress: { type: String, required: true },
        userAgent: { type: String, required: true },
        geolocation: {
            latitude: Number,
            longitude: Number,
        },
        status: {
            type: String,
            enum: ['active', 'superseded', 'revoked'],
            default: 'active',
        },
        supersededBy: { type: Schema.Types.ObjectId, ref: 'ConsentDocument' },
        revokedAt: { type: Date },
        revokedReason: { type: String, maxlength: 500 },
        auditTrail: [
            {
                action: { type: String, enum: ['created', 'viewed', 'superseded', 'revoked', 'exported'], required: true },
                performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
                performedAt: { type: Date, default: Date.now },
                ipAddress: String,
                details: String,
            },
        ],
    },
    { timestamps: true }
);

ConsentDocumentSchema.plugin(tenantPlugin);

ConsentDocumentSchema.index({ tenantId: 1, patientId: 1, documentType: 1, version: -1 });
ConsentDocumentSchema.index({ tenantId: 1, patientId: 1, status: 1 });
ConsentDocumentSchema.index({ tenantId: 1, acceptedAt: -1 });

// Immutability guard — prevent modification of signed content
ConsentDocumentSchema.pre('findOneAndUpdate', function () {
    const update = this.getUpdate() as any;
    const immutableFields = ['contentSnapshot', 'documentHash', 'acceptedAt', 'acceptanceMethod', 'ipAddress', 'userAgent', 'version'];
    for (const field of immutableFields) {
        if (update[field] || update?.$set?.[field]) {
            throw new Error(`Field '${field}' is immutable after signing`);
        }
    }
});

// Auto-hash content on creation
ConsentDocumentSchema.pre('save', function () {
    if (this.isNew) {
        const crypto = require('crypto');
        this.documentHash = crypto.createHash('sha256').update(this.contentSnapshot).digest('hex');
        this.auditTrail.push({
            action: 'created',
            performedAt: new Date(),
            ipAddress: this.ipAddress,
            details: `Consent v${this.version} type ${this.documentType} signed`,
        });
    }
});

export default mongoose.model<IConsentDocument>('ConsentDocument', ConsentDocumentSchema);
