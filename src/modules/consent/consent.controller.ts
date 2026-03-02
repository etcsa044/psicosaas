import { Response, NextFunction } from 'express';
import { IAuthRequest } from '@shared/types';
import { consentService } from './consent.service';
import { sendSuccess, sendCreated } from '@shared/utils/apiResponse';

export class ConsentController {
    // ── Templates ──
    async getTemplates(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const templates = await consentService.getTemplates(req.tenantId!);
            sendSuccess(res, templates);
        } catch (error) { next(error); }
    }

    async createTemplate(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const template = await consentService.createTemplate(req.tenantId!, req.body, req.user!._id);
            sendCreated(res, template);
        } catch (error) { next(error); }
    }

    async updateTemplate(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const template = await consentService.updateTemplate(
                req.tenantId!, req.params.id as string, req.body.content, req.body.summary, req.user!._id
            );
            sendSuccess(res, template);
        } catch (error) { next(error); }
    }

    // ── Patient Consents ──
    async signConsent(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const consent = await consentService.signConsent(
                req.tenantId!,
                req.params.patientId as string,
                req.body.templateId,
                {
                    method: req.body.acceptanceMethod,
                    signatureData: req.body.signatureData,
                    ipAddress: req.ip || 'unknown',
                    userAgent: req.get('User-Agent') || 'unknown',
                },
                req.user!._id
            );
            sendCreated(res, consent);
        } catch (error) { next(error); }
    }

    async getPatientConsents(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const consents = await consentService.getPatientConsents(req.tenantId!, req.params.patientId as string);
            sendSuccess(res, consents);
        } catch (error) { next(error); }
    }

    async revokeConsent(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const consent = await consentService.revokeConsent(
                req.tenantId!, req.params.id as string, req.body.reason, req.user!._id
            );
            sendSuccess(res, consent);
        } catch (error) { next(error); }
    }
}

export const consentController = new ConsentController();
