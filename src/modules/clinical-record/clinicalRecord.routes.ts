import { Router } from 'express';
import { clinicalRecordController } from './clinicalRecord.controller';
import { authMiddleware } from '@shared/middleware/auth.middleware';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';
import { requirePermission } from '@shared/middleware/permission.middleware';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.post('/', requirePermission('CREATE_CLINICAL_ENTRY'), (req, res, next) => clinicalRecordController.create(req as any, res, next));
router.get('/:id', requirePermission('VIEW_CLINICAL_RECORD'), (req, res, next) => clinicalRecordController.getById(req as any, res, next));
router.get('/patient/:patientId', requirePermission('VIEW_CLINICAL_RECORD'), (req, res, next) => clinicalRecordController.getByPatient(req as any, res, next));
router.patch('/:id', requirePermission('CREATE_CLINICAL_ENTRY'), (req, res, next) => clinicalRecordController.update(req as any, res, next));

export default router;
