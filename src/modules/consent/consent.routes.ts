import { Router } from 'express';
import { consentController } from './consent.controller';
import { authMiddleware } from '@shared/middleware/auth.middleware';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';
import { requirePermission } from '@shared/middleware/permission.middleware';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

// Templates
router.get('/templates', requirePermission('MANAGE_CONSENTS'), (req, res, next) => consentController.getTemplates(req as any, res, next));
router.post('/templates', requirePermission('MANAGE_CONSENTS'), (req, res, next) => consentController.createTemplate(req as any, res, next));
router.patch('/templates/:id', requirePermission('MANAGE_CONSENTS'), (req, res, next) => consentController.updateTemplate(req as any, res, next));

// Patient consents
router.post('/patients/:patientId/sign', requirePermission('MANAGE_CONSENTS'), (req, res, next) => consentController.signConsent(req as any, res, next));
router.get('/patients/:patientId', requirePermission('MANAGE_CONSENTS'), (req, res, next) => consentController.getPatientConsents(req as any, res, next));
router.post('/:id/revoke', requirePermission('MANAGE_CONSENTS'), (req, res, next) => consentController.revokeConsent(req as any, res, next));

export default router;
