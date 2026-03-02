import { Router } from 'express';
import { subscriptionController } from './subscription.controller';
import { authMiddleware } from '@shared/middleware/auth.middleware';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';
import { requirePermission } from '@shared/middleware/permission.middleware';

const router = Router();

// ── Mercado Pago Webhook (NO AUTH — validated via signature) ──
router.post('/webhook/mercado-pago', (req, res, next) => subscriptionController.mercadoPagoWebhook(req, res, next));

// ── Authenticated routes ──
router.use(authMiddleware, tenantMiddleware);

router.get('/', requirePermission('MANAGE_SUBSCRIPTION'), (req, res, next) => subscriptionController.getSubscription(req as any, res, next));
router.post('/upgrade', requirePermission('MANAGE_SUBSCRIPTION'), (req, res, next) => subscriptionController.upgrade(req as any, res, next));
router.post('/cancel', requirePermission('MANAGE_SUBSCRIPTION'), (req, res, next) => subscriptionController.cancel(req as any, res, next));
router.get('/invoices', requirePermission('VIEW_INVOICES'), (req, res, next) => subscriptionController.getInvoices(req as any, res, next));

export default router;
