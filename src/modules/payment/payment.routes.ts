import { Router } from 'express';
import { paymentController } from './payment.controller';
import { authMiddleware } from '@shared/middleware/auth.middleware';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';
import { requirePermission } from '@shared/middleware/permission.middleware';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.post('/', requirePermission('CREATE_PAYMENT'), (req, res, next) => paymentController.create(req as any, res, next));
router.get('/', requirePermission('VIEW_FINANCIALS'), (req, res, next) => paymentController.list(req as any, res, next));
router.get('/report', requirePermission('EXPORT_FINANCIALS'), (req, res, next) => paymentController.monthlyReport(req as any, res, next));
router.get('/patient/:patientId', requirePermission('VIEW_FINANCIALS'), (req, res, next) => paymentController.listByPatient(req as any, res, next));
router.get('/patient/:patientId/balance', requirePermission('VIEW_FINANCIALS'), (req, res, next) => paymentController.getBalance(req as any, res, next));
router.get('/:id', requirePermission('VIEW_FINANCIALS'), (req, res, next) => paymentController.getById(req as any, res, next));
router.patch('/:id', requirePermission('EDIT_PAYMENT'), (req, res, next) => paymentController.update(req as any, res, next));

export default router;
