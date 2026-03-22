import { Router } from 'express';
import { googleCalendarController } from './googleCalendar.controller';
import { authMiddleware } from '@shared/middleware/auth.middleware';
import { tenantMiddleware } from '@shared/middleware/tenant.middleware';

const router = Router();

// OAuth flow — auth route accepts token as query param (browser redirects can't carry Bearer headers)
router.get('/auth', googleCalendarController.auth);

// OAuth callback — this is called by Google, so we DON'T require auth middleware
// The userId is passed via the `state` query parameter
router.get('/callback', googleCalendarController.callback);

// Protected routes — require auth
router.get('/status', tenantMiddleware, authMiddleware, googleCalendarController.status);
router.post('/disconnect', tenantMiddleware, authMiddleware, googleCalendarController.disconnect);
router.patch('/settings', tenantMiddleware, authMiddleware, googleCalendarController.updateSettings);

export default router;
