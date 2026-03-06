import mongoose, { Schema, Document } from 'mongoose';

export interface IEvolution extends Document {
    patientId: mongoose.Types.ObjectId;
    createdByProfessionalId: mongoose.Types.ObjectId; // Crucial for medical audit/multi-tenant
    appointmentId?: mongoose.Types.ObjectId;
    date: Date;
    title: string;
    content: string; // Free text for maximum flexibility
    tags: string[];
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const evolutionSchema = new Schema(
    {
        patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
        createdByProfessionalId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' }, // Optional
        date: { type: Date, required: true, default: Date.now },
        title: { type: String, required: true, trim: true },
        content: { type: String, required: true },
        tags: [{ type: String, trim: true }],
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date },
    },
    { timestamps: true }
);

// Index to quickly fetch a patient's timeline in chronological order
evolutionSchema.index({ patientId: 1, date: -1 });

export const Evolution = mongoose.model<IEvolution>('Evolution', evolutionSchema, 'evolutions');
