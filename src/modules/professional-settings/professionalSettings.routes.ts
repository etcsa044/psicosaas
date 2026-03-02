import { Router } from 'express';
import { professionalSettingsController } from './professionalSettings.controller';
import { authMiddleware } from '@shared/middleware/auth.middleware';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get('/', professionalSettingsController.getSettings.bind(professionalSettingsController));
router.patch('/', professionalSettingsController.updateSettings.bind(professionalSettingsController));

export default router;
