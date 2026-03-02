import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '@shared/middleware/validator.middleware';
import { authRateLimiter } from '@shared/middleware/rateLimiter.middleware';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.validation';

const router = Router();

router.post(
    '/register',
    authRateLimiter,
    validate(registerSchema),
    (req, res, next) => authController.register(req, res, next)
);

router.post(
    '/login',
    authRateLimiter,
    validate(loginSchema),
    (req, res, next) => authController.login(req, res, next)
);

router.post(
    '/refresh-token',
    authRateLimiter,
    validate(refreshTokenSchema),
    (req, res, next) => authController.refreshToken(req, res, next)
);

router.post(
    '/logout',
    authRateLimiter,
    validate(refreshTokenSchema),
    (req, res, next) => authController.logout(req, res, next)
);

export default router;
