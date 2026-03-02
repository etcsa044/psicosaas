import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRefreshToken extends Document {
    tenantId: string;
    userId: Types.ObjectId;
    token: string;
    expiresAt: Date;
    revokedAt?: Date;
    replacedBy?: string;
    createdByIp?: string;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
    {
        tenantId: { type: String, required: true, index: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        token: { type: String, required: true, unique: true },
        expiresAt: { type: Date, required: true },
        revokedAt: { type: Date },
        replacedBy: { type: String },
        createdByIp: { type: String },
    },
    { timestamps: true }
);

RefreshTokenSchema.index({ userId: 1 });
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL auto-cleanup

export default mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);
