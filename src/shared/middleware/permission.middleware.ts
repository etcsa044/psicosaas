import { Response, NextFunction } from 'express';
import { IAuthRequest } from '@shared/types';
import { ForbiddenError } from '@shared/errors/AppError';
import Role from '@modules/rbac/models/role.model';
import { logger } from '@config/logger';

/**
 * Factory middleware that checks if the authenticated user has ALL required permissions.
 * Denials are logged in the audit trail.
 */
export function requirePermission(...requiredPermissions: string[]) {
    return async (req: IAuthRequest, _res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user || !req.tenantId) {
                return next(new ForbiddenError('Authentication required'));
            }

            const role = await Role.findOne({
                _id: req.user.roleId,
                tenantId: req.tenantId,
            }).lean();

            if (!role) {
                return next(new ForbiddenError('Role not found'));
            }

            const hasAll = requiredPermissions.every((p) => role.permissions.includes(p));

            if (!hasAll) {
                const missing = requiredPermissions.filter((p) => !role.permissions.includes(p));
                logger.warn('Permission denied', {
                    tenantId: req.tenantId,
                    userId: req.user._id,
                    roleName: role.name,
                    required: requiredPermissions,
                    missing,
                    path: req.path,
                    method: req.method,
                });
                return next(new ForbiddenError(`Missing permissions: ${missing.join(', ')}`));
            }

            // Attach role info to request for downstream use
            req.user.role = {
                name: role.name,
                permissions: role.permissions,
            };

            next();
        } catch (error) {
            next(error);
        }
    };
}
