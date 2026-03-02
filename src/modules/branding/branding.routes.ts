import { Router } from 'express';
import { brandingController } from './branding.controller';
import { authMiddleware } from '@shared/middleware/auth.middleware';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';
import { requirePermission } from '@shared/middleware/permission.middleware';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/', (req, res, next) => brandingController.getBranding(req as any, res, next));
router.patch('/', requirePermission('MANAGE_BRANDING'), (req, res, next) => brandingController.updateBranding(req as any, res, next));

export default router;
