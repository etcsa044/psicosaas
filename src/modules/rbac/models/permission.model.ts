import mongoose, { Schema, Document } from 'mongoose';

export interface IPermission extends Document {
    code: string;
    category: string;
    description: string;
}

const PermissionSchema = new Schema<IPermission>(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        category: {
            type: String,
            required: true,
            enum: ['clinical', 'patient', 'appointment', 'financial', 'admin', 'bot', 'reports'],
        },
        description: {
            type: String,
            required: true,
            maxlength: 300,
        },
    },
    { timestamps: true }
);

export default mongoose.model<IPermission>('Permission', PermissionSchema);
