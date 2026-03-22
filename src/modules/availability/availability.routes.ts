import { Router } from 'express';
import { availabilityController } from './availability.controller';
import { authMiddleware } from '@shared/middleware/auth.middleware';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';

const router = Router();

// Focus strictly on the professional's own availability
router.use(authMiddleware);
router.use(tenantMiddleware);

// Patterns (weekly default schema)
router.get('/patterns', availabilityController.getPatterns);
router.put('/patterns', availabilityController.updatePatterns);

// Exceptions (blocked days / holidays)
router.get('/exceptions', availabilityController.getExceptions);
router.post('/exceptions', availabilityController.setException);
router.delete('/exceptions/:id', availabilityController.removeException);

export default router;
