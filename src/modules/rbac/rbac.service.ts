import Role from './models/role.model';
import { SYSTEM_ROLES } from './rbac.seed';
import { NotFoundError, ForbiddenError, ConflictError } from '@shared/errors/AppError';
import { Types } from 'mongoose';

export class RbacService {
    /**
     * Create system roles for a new tenant (called during registration)
     */
    async createSystemRolesForTenant(tenantId: string, createdBy?: Types.ObjectId): Promise<typeof SYSTEM_ROLES> {
        const roles: Record<string, any> = {};

        for (const [key, template] of Object.entries(SYSTEM_ROLES)) {
            const existing = await Role.findOne({ tenantId, name: template.name });
            if (!existing) {
                const role = await Role.create({
                    ...template,
                    tenantId,
                    auditTrail: [
                        {
                            action: 'created',
                            performedBy: createdBy,
                            performedAt: new Date(),
                        },
                    ],
                });
                roles[key] = role;
            } else {
                roles[key] = existing;
            }
        }

        return roles as any;
    }

    async getRolesByTenant(tenantId: string) {
        return Role.find({ tenantId }).sort({ isSystem: -1, name: 1 }).lean();
    }

    async getRoleById(tenantId: string, roleId: string) {
        const role = await Role.findOne({ tenantId, _id: roleId }).lean();
        if (!role) throw new NotFoundError('Role');
        return role;
    }

    async createCustomRole(
        tenantId: string,
        data: { name: string; description: string; permissions: string[] },
        performedBy: Types.ObjectId
    ) {
        const existing = await Role.findOne({ tenantId, name: data.name });
        if (existing) throw new ConflictError(`Role '${data.name}' already exists`);

        return Role.create({
            tenantId,
            name: data.name,
            description: data.description,
            permissions: data.permissions,
            isSystem: false,
            auditTrail: [{ action: 'created', performedBy, performedAt: new Date() }],
        });
    }

    async updateRolePermissions(
        tenantId: string,
        roleId: string,
        permissions: string[],
        performedBy: Types.ObjectId
    ) {
        const role = await Role.findOne({ tenantId, _id: roleId });
        if (!role) throw new NotFoundError('Role');
        if (role.isSystem && role.name === 'OWNER') {
            throw new ForbiddenError('Cannot modify OWNER role permissions');
        }

        const added = permissions.filter((p) => !role.permissions.includes(p));
        const removed = role.permissions.filter((p) => !permissions.includes(p));

        role.permissions = permissions;
        role.auditTrail.push({
            action: 'permissions_changed',
            performedBy,
            performedAt: new Date(),
            changes: { added, removed },
        });

        await role.save();
        return role;
    }

    async deleteRole(tenantId: string, roleId: string) {
        const role = await Role.findOne({ tenantId, _id: roleId });
        if (!role) throw new NotFoundError('Role');
        if (role.isSystem) throw new ForbiddenError('System roles cannot be deleted');
        await role.deleteOne();
    }
}

export const rbacService = new RbacService();
