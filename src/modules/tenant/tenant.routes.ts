import { Router } from 'express';
import { tenantController } from './tenant.controller';
import { authMiddleware } from '@shared/middleware/auth.middleware';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';
import { requirePermission } from '@shared/middleware/permission.middleware';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/me', (req, res, next) => tenantController.getMyTenant(req as any, res, next));
router.patch('/me', requirePermission('MANAGE_SUBSCRIPTION'), (req, res, next) => tenantController.updateMyTenant(req as any, res, next));

export default router;
