import mongoose, { Schema, Document, Types } from 'mongoose';
import { tenantPlugin } from '@shared/plugins/tenant.plugin';

export interface IUser extends Document {
    tenantId: string;
    email: string;
    passwordHash: string;
    roleId: Types.ObjectId;
    profile: {
        firstName: string;
        lastName: string;
        licenseNumber?: string;
        phone?: string;
        avatarUrl?: string;
    };
    isActive: boolean;
    lastLoginAt?: Date;
    googleIntegration?: {
        connected: boolean;
        email?: string;
        refreshToken?: string;
        accessToken?: string;
        tokenExpiry?: Date;
        autoMeet?: boolean;
        calendarId?: string;
    };
}

const UserSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            lowercase: true,
            trim: true,
            match: [/^[\w.-]+@[\w.-]+\.\w{2,}$/, 'Invalid email format'],
        },
        passwordHash: {
            type: String,
            required: true,
            select: false, // Never returned in queries by default
        },
        roleId: {
            type: Schema.Types.ObjectId,
            ref: 'Role',
            required: true,
        },
        profile: {
            firstName: { type: String, required: true, maxlength: 100, trim: true },
            lastName: { type: String, required: true, maxlength: 100, trim: true },
            licenseNumber: { type: String, trim: true },
            phone: { type: String, trim: true },
            avatarUrl: { type: String },
        },
        isActive: { type: Boolean, default: true },
        lastLoginAt: { type: Date },
        googleIntegration: {
            connected: { type: Boolean, default: false },
            email: { type: String },
            refreshToken: { type: String, select: false },
            accessToken: { type: String, select: false },
            tokenExpiry: { type: Date },
            autoMeet: { type: Boolean, default: true },
            calendarId: { type: String, default: 'primary' },
        },
    },
    { timestamps: true }
);

UserSchema.plugin(tenantPlugin);

UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });
UserSchema.index({ tenantId: 1, roleId: 1 });
UserSchema.index({ tenantId: 1, isActive: 1 });

export default mongoose.model<IUser>('User', UserSchema);
