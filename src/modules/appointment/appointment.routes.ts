import { Router } from 'express';
import { appointmentController } from './appointment.controller';
import { authMiddleware } from '@shared/middleware/auth.middleware';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';
import { requirePermission } from '@shared/middleware/permission.middleware';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

// Appointments
router.post('/', requirePermission('CREATE_APPOINTMENT'), (req, res, next) => appointmentController.create(req as any, res, next));
router.get('/', requirePermission('VIEW_APPOINTMENT'), (req, res, next) => appointmentController.list(req as any, res, next));
router.get('/availability', requirePermission('VIEW_APPOINTMENT'), (req, res, next) => appointmentController.getAvailableSlots(req as any, res, next));
router.get('/:id', requirePermission('VIEW_APPOINTMENT'), (req, res, next) => appointmentController.getById(req as any, res, next));
router.patch('/:id', requirePermission('EDIT_APPOINTMENT'), (req, res, next) => appointmentController.update(req as any, res, next));
router.patch('/:id/status', requirePermission('EDIT_APPOINTMENT'), (req, res, next) => appointmentController.updateStatus(req as any, res, next));
router.patch('/:id/reschedule', requirePermission('EDIT_APPOINTMENT'), (req, res, next) => appointmentController.reschedule(req as any, res, next));
router.patch('/:id/cancel', requirePermission('CANCEL_APPOINTMENT'), (req, res, next) => appointmentController.cancel(req as any, res, next));
router.delete('/:id', requirePermission('CANCEL_APPOINTMENT'), (req, res, next) => appointmentController.delete(req as any, res, next));

// Schedule
router.get('/schedule/:professionalId', requirePermission('VIEW_SCHEDULE'), (req, res, next) => appointmentController.getSchedule(req as any, res, next));
router.put('/schedule', requirePermission('EDIT_SCHEDULE'), (req, res, next) => appointmentController.upsertSchedule(req as any, res, next));
router.post('/schedule/block', requirePermission('EDIT_SCHEDULE'), (req, res, next) => appointmentController.blockSlot(req as any, res, next));
router.post('/schedule/vacation', requirePermission('EDIT_SCHEDULE'), (req, res, next) => appointmentController.addVacation(req as any, res, next));

export default router;
