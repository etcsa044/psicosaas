import ConsentDocument, { IConsentDocument } from './models/consentDocument.model';
import ConsentTemplate, { IConsentTemplate } from './models/consentTemplate.model';
import { NotFoundError } from '@shared/errors/AppError';
import { Types } from 'mongoose';

export class ConsentService {
    // ── Templates ──
    async createTemplate(tenantId: string, data: Partial<IConsentTemplate>, userId: Types.ObjectId): Promise<IConsentTemplate> {
        return ConsentTemplate.create({
            tenantId,
            ...data,
            changelog: [{ version: 1, changedBy: userId, changedAt: new Date(), summary: 'Initial version' }],
        });
    }

    async getTemplates(tenantId: string): Promise<IConsentTemplate[]> {
        return ConsentTemplate.find({ tenantId, isActive: true }).lean() as any;
    }

    async updateTemplate(tenantId: string, templateId: string, content: string, summary: string, userId: Types.ObjectId): Promise<IConsentTemplate> {
        const template = await ConsentTemplate.findOne({ tenantId, _id: templateId });
        if (!template) throw new NotFoundError('ConsentTemplate');

        template.currentVersion += 1;
        template.content = content;
        template.changelog.push({
            version: template.currentVersion,
            changedBy: userId,
            changedAt: new Date(),
            summary,
        });

        await template.save();
        return template;
    }

    // ── Documents (signed consents) ──
    async signConsent(
        tenantId: string,
        patientId: string,
        templateId: string,
        acceptanceData: { method: string; signatureData?: string; ipAddress: string; userAgent: string },
        userId: Types.ObjectId
    ): Promise<IConsentDocument> {
        const template = await ConsentTemplate.findOne({ tenantId, _id: templateId });
        if (!template) throw new NotFoundError('ConsentTemplate');

        // Supersede any existing active consent of same type for this patient
        const existing = await ConsentDocument.findOne({
            tenantId,
            patientId,
            documentType: template.documentType,
            status: 'active',
        });

        let version = 1;
        if (existing) {
            existing.status = 'superseded';
            existing.auditTrail.push({
                action: 'superseded',
                performedBy: userId,
                performedAt: new Date(),
                details: `Superseded by new version`,
            });
            await existing.save();
            version = (existing.version || 0) + 1;
        }

        const consent = await ConsentDocument.create({
            tenantId,
            patientId,
            documentType: template.documentType,
            version,
            contentSnapshot: template.content,
            acceptedAt: new Date(),
            acceptanceMethod: acceptanceData.method,
            signatureData: acceptanceData.signatureData,
            ipAddress: acceptanceData.ipAddress,
            userAgent: acceptanceData.userAgent,
            supersededBy: existing ? undefined : undefined,
        });

        if (existing) {
            existing.supersededBy = consent._id as Types.ObjectId;
            await existing.save();
        }

        return consent;
    }

    async getPatientConsents(tenantId: string, patientId: string): Promise<IConsentDocument[]> {
        return ConsentDocument.find({ tenantId, patientId }).sort({ acceptedAt: -1 }).lean() as any;
    }

    async getActiveConsents(tenantId: string, patientId: string): Promise<IConsentDocument[]> {
        return ConsentDocument.find({ tenantId, patientId, status: 'active' }).lean() as any;
    }

    async revokeConsent(tenantId: string, consentId: string, reason: string, userId: Types.ObjectId): Promise<IConsentDocument> {
        const consent = await ConsentDocument.findOne({ tenantId, _id: consentId });
        if (!consent) throw new NotFoundError('ConsentDocument');

        consent.status = 'revoked';
        consent.revokedAt = new Date();
        consent.revokedReason = reason;
        consent.auditTrail.push({
            action: 'revoked',
            performedBy: userId,
            performedAt: new Date(),
            details: `Revoked: ${reason}`,
        });

        await consent.save();
        return consent;
    }
}

export const consentService = new ConsentService();
