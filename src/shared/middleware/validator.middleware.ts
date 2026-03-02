import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '@shared/errors/AppError';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Generic validation middleware using Zod schemas.
 * Validates the specified request target (body, query, or params).
 */
export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            const parsed = schema.parse(req[target]);
            (req as any)[target] = parsed;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.issues.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                }));
                next(new ValidationError('Validation failed', errors));
            } else {
                next(error);
            }
        }
    };
}
