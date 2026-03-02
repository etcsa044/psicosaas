import { Response, NextFunction } from 'express';
import { IAuthRequest } from '@shared/types';
import { attachmentService } from './attachment.service';
import { sendSuccess, sendCreated, sendNoContent } from '@shared/utils/apiResponse';

export class AttachmentController {
    async upload(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const file = (req as any).file;
            if (!file) {
                return res.status(400).json({ status: 'error', message: 'No file uploaded' });
            }
            const attachment = await attachmentService.upload(
                req.tenantId!,
                req.body.entityType,
                req.body.entityId,
                file,
                req.body.accessLevel || 'administrative',
                req.user!._id,
                req.body.description
            );
            sendCreated(res, attachment);
        } catch (error) { next(error); }
    }

    async getByEntity(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const attachments = await attachmentService.getByEntity(
                req.tenantId!, req.query.entityType as string, req.query.entityId as string
            );
            sendSuccess(res, attachments);
        } catch (error) { next(error); }
    }

    async getDownloadUrl(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const url = await attachmentService.getSignedUrl(req.tenantId!, req.params.id as string);
            sendSuccess(res, { url });
        } catch (error) { next(error); }
    }

    async remove(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            await attachmentService.softDelete(req.tenantId!, req.params.id as string, req.user!._id);
            sendNoContent(res);
        } catch (error) { next(error); }
    }
}

export const attachmentController = new AttachmentController();
