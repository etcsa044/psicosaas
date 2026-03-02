import { Response, NextFunction } from 'express';
import { IAuthRequest } from '@shared/types';
import { rbacService } from './rbac.service';
import { sendSuccess, sendCreated, sendNoContent } from '@shared/utils/apiResponse';

export class RbacController {
    async getRoles(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const roles = await rbacService.getRolesByTenant(req.tenantId!);
            sendSuccess(res, roles);
        } catch (error) { next(error); }
    }

    async getRoleById(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const role = await rbacService.getRoleById(req.tenantId!, id);
            sendSuccess(res, role);
        } catch (error) { next(error); }
    }

    async createRole(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const role = await rbacService.createCustomRole(req.tenantId!, req.body, req.user!._id);
            sendCreated(res, role);
        } catch (error) { next(error); }
    }

    async updatePermissions(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const role = await rbacService.updateRolePermissions(
                req.tenantId!, id, req.body.permissions, req.user!._id
            );
            sendSuccess(res, role);
        } catch (error) { next(error); }
    }

    async deleteRole(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            await rbacService.deleteRole(req.tenantId!, id);
            sendNoContent(res);
        } catch (error) { next(error); }
    }
}

export const rbacController = new RbacController();
