import { Router } from 'express';
import { attachmentController } from './attachment.controller';
import { authMiddleware } from '@shared/middleware/auth.middleware';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';
import { requirePermission } from '@shared/middleware/permission.middleware';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

// Upload requires at minimum VIEW_PATIENT (access level checked in service)
router.post('/', requirePermission('VIEW_PATIENT'), (req, res, next) => attachmentController.upload(req as any, res, next));
router.get('/', requirePermission('VIEW_PATIENT'), (req, res, next) => attachmentController.getByEntity(req as any, res, next));
router.get('/:id/download', requirePermission('VIEW_PATIENT'), (req, res, next) => attachmentController.getDownloadUrl(req as any, res, next));
router.delete('/:id', requirePermission('EDIT_PATIENT'), (req, res, next) => attachmentController.remove(req as any, res, next));

export default router;
