import { Response, NextFunction } from 'express';
import { IAuthRequest } from '@shared/types';
import { ForbiddenError } from '@shared/errors/AppError';

export function tenantMiddleware(req: IAuthRequest, _res: Response, next: NextFunction): void {
    if (!req.user?.tenantId) {
        return next(new ForbiddenError('Tenant identification required'));
    }
    req.tenantId = req.user.tenantId;
    next();
}
