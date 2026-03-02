import { Router } from 'express';
import { authMiddleware } from '@shared/middleware/auth.middleware';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';
import { requirePermission } from '@shared/middleware/permission.middleware';
import { agendaController } from '@modules/agenda/agenda.controller';

const router = Router();

// Secure all routes
router.use(authMiddleware, tenantMiddleware);

// Motor Generation: Get weekly slots
router.get('/week', requirePermission('VIEW_APPOINTMENT'), (req, res, next) => agendaController.getWeeklyAgenda(req as any, res, next));

// Appointment Creation: Atomically book a slot
router.post('/appointment', requirePermission('CREATE_APPOINTMENT'), (req, res, next) => agendaController.createAppointment(req as any, res, next));

export default router;
