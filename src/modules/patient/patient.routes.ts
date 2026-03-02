import { Router } from 'express';
import { patientController } from './patient.controller';
import { authMiddleware } from '@shared/middleware/auth.middleware';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';
import { requirePermission } from '@shared/middleware/permission.middleware';
import { validate } from '@shared/middleware/validator.middleware';
import { createPatientSchema, updatePatientSchema } from './patient.validation';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.post('/', requirePermission('CREATE_PATIENT'), validate(createPatientSchema), (req, res, next) => patientController.create(req as any, res, next));
router.get('/', requirePermission('VIEW_PATIENT'), (req, res, next) => patientController.list(req as any, res, next));
router.get('/:id', requirePermission('VIEW_PATIENT'), (req, res, next) => patientController.getById(req as any, res, next));
router.patch('/:id', requirePermission('EDIT_PATIENT'), validate(updatePatientSchema), (req, res, next) => patientController.update(req as any, res, next));
router.delete('/:id', requirePermission('DELETE_PATIENT'), (req, res, next) => patientController.remove(req as any, res, next));

export default router;
