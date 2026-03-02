import { Router } from 'express';
import { rbacController } from './rbac.controller';
import { authMiddleware } from '@shared/middleware/auth.middleware';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';
import { requirePermission } from '@shared/middleware/permission.middleware';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/', requirePermission('MANAGE_ROLES'), (req, res, next) => rbacController.getRoles(req as any, res, next));
router.get('/:id', requirePermission('MANAGE_ROLES'), (req, res, next) => rbacController.getRoleById(req as any, res, next));
router.post('/', requirePermission('MANAGE_ROLES'), (req, res, next) => rbacController.createRole(req as any, res, next));
router.patch('/:id/permissions', requirePermission('MANAGE_ROLES'), (req, res, next) => rbacController.updatePermissions(req as any, res, next));
router.delete('/:id', requirePermission('MANAGE_ROLES'), (req, res, next) => rbacController.deleteRole(req as any, res, next));

export default router;
