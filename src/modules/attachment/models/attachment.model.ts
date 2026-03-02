import mongoose, { Schema, Document, Types } from 'mongoose';
import { tenantPlugin } from '@shared/plugins/tenant.plugin';
import { softDeletePlugin } from '@shared/plugins/softDelete.plugin';

export interface IAttachment extends Document {
    tenantId: string;
    relatedEntityType: string;
    relatedEntityId: Types.ObjectId;
    fileName: string;
    originalName: string;
    fileType: string;
    fileSize: number;
    storageProvider: string;
    storagePath: string;
    storageBucket?: string;
    checksum: string;
    accessLevel: string;
    uploadedBy: Types.ObjectId;
    description?: string;
    isDeleted: boolean;
}

const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg', 'image/png', 'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const AttachmentSchema = new Schema<IAttachment>(
    {
        relatedEntityType: {
            type: String,
            required: true,
            enum: ['Patient', 'ClinicalEntry', 'Appointment', 'Payment', 'ConsentDocument'],
        },
        relatedEntityId: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: 'relatedEntityType',
        },
        fileName: { type: String, required: true, maxlength: 255 },
        originalName: { type: String, required: true, maxlength: 255 },
        fileType: {
            type: String,
            required: true,
            enum: ALLOWED_MIME_TYPES,
        },
        fileSize: {
            type: Number,
            required: true,
            max: 10 * 1024 * 1024, // 10 MB
        },
        storageProvider: {
            type: String,
            enum: ['s3', 'minio', 'local', 'gcs'],
            default: 's3',
        },
        storagePath: { type: String, required: true },
        storageBucket: { type: String },
        checksum: { type: String, required: true },
        accessLevel: {
            type: String,
            enum: ['clinical', 'administrative', 'financial'],
            required: true,
        },
        uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        description: { type: String, maxlength: 500 },
    },
    { timestamps: true }
);

AttachmentSchema.plugin(tenantPlugin);
AttachmentSchema.plugin(softDeletePlugin);

AttachmentSchema.index({ tenantId: 1, relatedEntityType: 1, relatedEntityId: 1 });
AttachmentSchema.index({ tenantId: 1, uploadedBy: 1, createdAt: -1 });
AttachmentSchema.index({ tenantId: 1, accessLevel: 1 });

export default mongoose.model<IAttachment>('Attachment', AttachmentSchema);
