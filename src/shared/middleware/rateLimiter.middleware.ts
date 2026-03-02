import rateLimit from 'express-rate-limit';
import { config } from '@config/index';

export const globalRateLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'error',
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later.',
    },
});

export const authRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'error',
        code: 'AUTH_RATE_LIMIT',
        message: 'Too many authentication attempts. Please try again in 1 minute.',
    },
});
