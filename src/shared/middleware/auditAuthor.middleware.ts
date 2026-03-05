import { Response, NextFunction } from 'express';
import { IAuthRequest } from '@shared/types';

/**
 * Middleware de Autoría — Phase 6 Traceability
 * 
 * Inyecta `_auditUserId` en req.body para que los services
 * puedan setear createdBy/updatedBy sin depender del controller.
 * 
 * DEBE montarse DESPUÉS de auth.middleware (req.user ya existe).
 */
export function auditAuthor(req: IAuthRequest, _res: Response, next: NextFunction): void {
    if (req.user?._id) {
        if (!req.body) req.body = {};
        req.body._auditUserId = req.user._id;
    }
    next();
}
