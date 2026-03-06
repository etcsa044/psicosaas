import { Router } from 'express';
import { feedbackController } from './feedback.controller';
import { authMiddleware } from '@shared/middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', (req, res, next) => feedbackController.create(req, res, next));
router.get('/', (req, res, next) => feedbackController.list(req, res, next));

export default router;
