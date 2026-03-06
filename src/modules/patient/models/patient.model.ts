import mongoose, { Schema, Document, Types } from 'mongoose';
import { tenantPlugin } from '@shared/plugins/tenant.plugin';
import { softDeletePlugin } from '@shared/plugins/softDelete.plugin';
import { auditPlugin } from '@shared/plugins/audit.plugin';

export interface IPatient extends Document {
    tenantId: string;
    patientType: string;
    personalInfo: {
        firstName: string;
        lastName: string;
        dni?: string;
        birthDate?: Date;
        gender?: string;
        phone: string;
        email?: string;
        address?: {
            street?: string;
            city?: string;
            province?: string;
            zipCode?: string;
        };
    };
    emergencyContact?: {
        name?: string;
        phone?: string;
        relationship?: string;
    };
    status: string;
    insuranceInfo?: {
        provider?: string;
        planName?: string;
        memberNumber?: string;
    };
    generalObservations?: string;
    isDeleted: boolean;
    deletedAt?: Date;
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
}

const PatientSchema = new Schema<IPatient>(
    {
        patientType: {
            type: String,
            enum: ['semanal', 'quincenal', 'mensual', 'personalizado'],
            default: 'semanal',
        },
        personalInfo: {
            firstName: { type: String, required: true, maxlength: 100, trim: true },
            lastName: { type: String, required: true, maxlength: 100, trim: true },
            dni: { type: String, trim: true },
            birthDate: { type: Date },
            gender: { type: String, enum: ['M', 'F', 'NB', 'other', 'undisclosed'] },
            phone: { type: String, required: true, trim: true },
            email: { type: String, lowercase: true, trim: true },
            address: {
                street: { type: String, maxlength: 200 },
                city: { type: String, maxlength: 100 },
                province: { type: String, maxlength: 100 },
                zipCode: { type: String, maxlength: 20 },
            },
        },
        emergencyContact: {
            name: { type: String, maxlength: 200 },
            phone: { type: String },
            relationship: { type: String, maxlength: 100 },
        },
        status: {
            type: String,
            enum: ['active', 'discharged', 'suspended'],
            default: 'active',
        },
        insuranceInfo: {
            provider: { type: String, maxlength: 200 },
            planName: { type: String, maxlength: 200 },
            memberNumber: { type: String },
        },
        generalObservations: { type: String, maxlength: 5000 },
    },
    { timestamps: true }
);

PatientSchema.plugin(tenantPlugin);
PatientSchema.plugin(softDeletePlugin);
PatientSchema.plugin(auditPlugin);

PatientSchema.index({ tenantId: 1, status: 1 });
PatientSchema.index({ tenantId: 1, 'personalInfo.lastName': 1 });
PatientSchema.index({ tenantId: 1, 'personalInfo.phone': 1 });
PatientSchema.index({ tenantId: 1, 'personalInfo.email': 1 });

export default mongoose.model<IPatient>('Patient', PatientSchema);
