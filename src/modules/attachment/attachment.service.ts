import Attachment, { IAttachment } from './models/attachment.model';
import { NotFoundError, ValidationError } from '@shared/errors/AppError';
import { IStorageProvider } from '@shared/storage/storage.interface';
import { LocalStorageProvider } from '@shared/storage/local.provider';
import { hashSHA256 } from '@shared/utils/encryption';
import { Types } from 'mongoose';

// Default to local storage — swap for S3 provider in production
const storageProvider: IStorageProvider = new LocalStorageProvider();

export class AttachmentService {
    async upload(
        tenantId: string,
        entityType: string,
        entityId: string,
        file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
        accessLevel: string,
        userId: Types.ObjectId,
        description?: string
    ): Promise<IAttachment> {
        // Validate file size
        if (file.size > 10 * 1024 * 1024) {
            throw new ValidationError('File exceeds 10 MB limit');
        }

        // Calculate checksum
        const checksum = hashSHA256(file.buffer.toString('binary'));

        // Upload to storage
        const result = await storageProvider.upload({
            tenantId,
            fileName: file.originalname,
            buffer: file.buffer,
            mimeType: file.mimetype,
        });

        return Attachment.create({
            tenantId,
            relatedEntityType: entityType,
            relatedEntityId: entityId,
            fileName: result.storagePath.split('/').pop(),
            originalName: file.originalname,
            fileType: file.mimetype,
            fileSize: file.size,
            storageProvider: 'local',
            storagePath: result.storagePath,
            storageBucket: result.bucket,
            checksum,
            accessLevel,
            uploadedBy: userId,
            description,
        });
    }

    async getByEntity(tenantId: string, entityType: string, entityId: string): Promise<IAttachment[]> {
        return Attachment.find({ tenantId, relatedEntityType: entityType, relatedEntityId: entityId }).lean() as any;
    }

    async getSignedUrl(tenantId: string, attachmentId: string): Promise<string> {
        const attachment = await Attachment.findOne({ tenantId, _id: attachmentId });
        if (!attachment) throw new NotFoundError('Attachment');
        return storageProvider.getSignedUrl(attachment.storagePath, 900); // 15 min
    }

    async softDelete(tenantId: string, attachmentId: string, userId: Types.ObjectId): Promise<void> {
        const attachment = await Attachment.findOne({ tenantId, _id: attachmentId });
        if (!attachment) throw new NotFoundError('Attachment');
        (attachment as any).softDelete(userId.toString());
    }
}

export const attachmentService = new AttachmentService();
