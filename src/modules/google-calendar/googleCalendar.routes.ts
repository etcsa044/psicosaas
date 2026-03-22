import { Router } from 'express';
import { googleCalendarController } from './googleCalendar.controller';
import { authMiddleware } from '@shared/middleware/auth.middleware';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';

const router = Router();

// OAuth flow — auth route requires authentication so we know which user is connecting
router.get('/auth', tenantMiddleware, authMiddleware, googleCalendarController.auth);

// OAuth callback — this is called by Google, so we DON'T require auth middleware
// The userId is passed via the `state` query parameter
router.get('/callback', googleCalendarController.callback);

// Protected routes — require auth
router.get('/status', tenantMiddleware, authMiddleware, googleCalendarController.status);
router.post('/disconnect', tenantMiddleware, authMiddleware, googleCalendarController.disconnect);
router.patch('/settings', tenantMiddleware, authMiddleware, googleCalendarController.updateSettings);

export default router;
