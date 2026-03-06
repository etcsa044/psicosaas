import { Router } from 'express';
import { patientController } from './patient.controller';
import { authMiddleware } from '@shared/middleware/auth.middleware';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';
import { requirePermission } from '@shared/middleware/permission.middleware';
import { validate } from '@shared/middleware/validator.middleware';
import { createPatientSchema, updatePatientSchema } from './patient.validation';
import { evolutionController } from './evolution.controller';
import { documentController } from './document.controller';
import { createEvolutionSchema, updateEvolutionSchema, createDocumentSchema } from './evolution.validation';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.post('/', requirePermission('CREATE_PATIENT'), validate(createPatientSchema), (req, res, next) => patientController.create(req as any, res, next));
router.get('/', requirePermission('VIEW_PATIENT'), (req, res, next) => patientController.list(req as any, res, next));
router.get('/:id', requirePermission('VIEW_PATIENT'), (req, res, next) => patientController.getById(req as any, res, next));
router.get('/:id/appointment-history', requirePermission('VIEW_PATIENT'), (req, res, next) => patientController.getAppointmentHistory(req as any, res, next));
router.get('/:id/cancellation-stats', requirePermission('VIEW_PATIENT'), (req, res, next) => patientController.getCancellationStats(req as any, res, next));
router.patch('/:id', requirePermission('EDIT_PATIENT'), validate(updatePatientSchema), (req, res, next) => patientController.update(req as any, res, next));
router.delete('/:id', requirePermission('DELETE_PATIENT'), (req, res, next) => patientController.remove(req as any, res, next));

// Evolutions (Session Notes)
router.post('/:id/evolutions', requirePermission('CREATE_PATIENT'), validate(createEvolutionSchema), (req, res, next) => evolutionController.createEvol(req as any, res, next));
router.get('/:id/evolutions', requirePermission('VIEW_PATIENT'), (req, res, next) => evolutionController.listEvol(req as any, res, next));
router.patch('/:id/evolutions/:evolId', requirePermission('EDIT_PATIENT'), validate(updateEvolutionSchema), (req, res, next) => evolutionController.updateEvol(req as any, res, next));
router.delete('/:id/evolutions/:evolId', requirePermission('DELETE_PATIENT'), (req, res, next) => evolutionController.deleteEvol(req as any, res, next));

// Patient Documents (Attachments)
router.post('/:id/documents', requirePermission('CREATE_PATIENT'), validate(createDocumentSchema), (req, res, next) => documentController.createDoc(req as any, res, next));
router.get('/:id/documents', requirePermission('VIEW_PATIENT'), (req, res, next) => documentController.listDocs(req as any, res, next));
router.delete('/:id/documents/:docId', requirePermission('DELETE_PATIENT'), (req, res, next) => documentController.deleteDoc(req as any, res, next));

export default router;
