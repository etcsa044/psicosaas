import { Router } from 'express';
import { metricsController } from './metrics.controller';
import { authMiddleware } from '@shared/middleware/auth.middleware';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';
import { requirePermission } from '@shared/middleware/permission.middleware';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/current', requirePermission('VIEW_TENANT_METRICS'), (req, res, next) => metricsController.getCurrentMonth(req as any, res, next));
router.get('/period', requirePermission('VIEW_TENANT_METRICS'), (req, res, next) => metricsController.getByPeriod(req as any, res, next));
router.get('/range', requirePermission('VIEW_TENANT_METRICS'), (req, res, next) => metricsController.getRange(req as any, res, next));
router.post('/recalculate', requirePermission('VIEW_TENANT_METRICS'), (req, res, next) => metricsController.recalculate(req as any, res, next));

export default router;
