import { Request, Response, NextFunction } from 'express';
import { AppError } from '@shared/errors/AppError';
import { logger } from '@config/logger';
import { config } from '@config/index';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
    // Operational errors (known, expected)
    if (err instanceof AppError) {
        logger.warn(`[${err.code}] ${err.message}`, {
            statusCode: err.statusCode,
            path: req.path,
            method: req.method,
            ip: req.ip,
        });

        res.status(err.statusCode).json({
            status: 'error',
            code: err.code,
            message: err.message,
            ...('errors' in err ? { errors: (err as any).errors } : {}),
        });
        return;
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const mongooseErr = err as any;
        const errors = Object.values(mongooseErr.errors).map((e: any) => ({
            field: e.path,
            message: e.message,
        }));

        res.status(400).json({
            status: 'error',
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            errors,
        });
        return;
    }

    // Mongoose duplicate key error
    if ((err as any).code === 11000) {
        const field = Object.keys((err as any).keyValue || {})[0] || 'field';
        res.status(409).json({
            status: 'error',
            code: 'DUPLICATE_KEY',
            message: `A record with this ${field} already exists`,
        });
        return;
    }

    // Unknown / programming errors
    logger.error('Unhandled error:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    res.status(500).json({
        status: 'error',
        code: 'INTERNAL_ERROR',
        message: config.isProduction
            ? 'An unexpected error occurred'
            : err.message,
    });
}
