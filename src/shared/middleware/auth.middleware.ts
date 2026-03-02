import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@config/index';
import { IAuthRequest, IAuthUser } from '@shared/types';
import { UnauthorizedError } from '@shared/errors/AppError';

export function authMiddleware(req: IAuthRequest, _res: Response, next: NextFunction): void {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('No token provided');
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, config.jwt.accessSecret) as IAuthUser;

        req.user = decoded;
        req.tenantId = decoded.tenantId;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            next(new UnauthorizedError('Token expired'));
        } else if (error instanceof jwt.JsonWebTokenError) {
            next(new UnauthorizedError('Invalid token'));
        } else {
            next(error);
        }
    }
}

/**
 * Optional auth — sets user if token present, continues otherwise
 */
export function optionalAuth(req: IAuthRequest, _res: Response, next: NextFunction): void {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            req.user = jwt.verify(token, config.jwt.accessSecret) as IAuthUser;
            req.tenantId = req.user.tenantId;
        }
        next();
    } catch {
        next(); // Invalid token is fine for optional auth
    }
}
