import mongoose, { Schema, Document } from 'mongoose';

export interface IPatientDocument extends Document {
    patientId: mongoose.Types.ObjectId;
    uploadedBy: mongoose.Types.ObjectId;
    fileUrl: string;
    fileName: string;
    type: 'informe' | 'estudio' | 'receta' | 'documento' | 'otro';
    createdAt: Date;
    updatedAt: Date;
}

const patientDocumentSchema = new Schema(
    {
        patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
        uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        fileUrl: { type: String, required: true },
        fileName: { type: String, required: true, trim: true },
        type: {
            type: String,
            enum: ['informe', 'estudio', 'receta', 'documento', 'otro'],
            default: 'documento'
        },
    },
    { timestamps: true }
);

export const PatientDocument = mongoose.model<IPatientDocument>('PatientDocument', patientDocumentSchema, 'patient_documents');
