jest.mock('@modules/rbac/models/role.model');

import { RbacService } from '@modules/rbac/rbac.service';
import Role from '@modules/rbac/models/role.model';
import { NotFoundError, ForbiddenError, ConflictError } from '@shared/errors/AppError';
import { Types } from 'mongoose';

const service = new RbacService();
const userId = new Types.ObjectId();

describe('RbacService', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('createSystemRolesForTenant', () => {
        it('should create all system roles for a new tenant', async () => {
            (Role.findOne as jest.Mock).mockResolvedValue(null);
            (Role.create as jest.Mock).mockImplementation((data) =>
                Promise.resolve({ _id: new Types.ObjectId(), ...data })
            );

            const roles = await service.createSystemRolesForTenant('t1', userId);
            expect(Role.create).toHaveBeenCalled();
            expect(roles).toHaveProperty('OWNER');
            expect(roles).toHaveProperty('ASSISTANT');
        });

        it('should skip existing roles', async () => {
            const existingRole = { _id: new Types.ObjectId(), name: 'OWNER' };
            (Role.findOne as jest.Mock).mockResolvedValue(existingRole);

            const roles = await service.createSystemRolesForTenant('t1');
            expect(Role.create).not.toHaveBeenCalled();
        });
    });

    describe('getRolesByTenant', () => {
        it('should return roles sorted', async () => {
            const roles = [{ name: 'OWNER' }, { name: 'ASSISTANT' }];
            (Role.find as jest.Mock).mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(roles),
                }),
            });

            const result = await service.getRolesByTenant('t1');
            expect(result).toEqual(roles);
        });
    });

    describe('getRoleById', () => {
        it('should return role when found', async () => {
            const role = { _id: 'r1', name: 'OWNER' };
            (Role.findOne as jest.Mock).mockReturnValue({
                lean: jest.fn().mockResolvedValue(role),
            });

            const result = await service.getRoleById('t1', 'r1');
            expect(result).toEqual(role);
        });

        it('should throw NotFoundError when not found', async () => {
            (Role.findOne as jest.Mock).mockReturnValue({
                lean: jest.fn().mockResolvedValue(null),
            });

            await expect(service.getRoleById('t1', 'nope'))
                .rejects.toThrow(NotFoundError);
        });
    });

    describe('createCustomRole', () => {
        it('should create a custom role', async () => {
            (Role.findOne as jest.Mock).mockResolvedValue(null);
            const roleData = { name: 'INTERN', description: 'Intern role', permissions: ['VIEW_PATIENT'] };
            const expected = { _id: new Types.ObjectId(), ...roleData };
            (Role.create as jest.Mock).mockResolvedValue(expected);

            const result = await service.createCustomRole('t1', roleData, userId);
            expect(result).toEqual(expected);
        });

        it('should throw ConflictError if role name exists', async () => {
            (Role.findOne as jest.Mock).mockResolvedValue({ name: 'INTERN' });

            await expect(
                service.createCustomRole('t1', { name: 'INTERN', description: '', permissions: [] }, userId)
            ).rejects.toThrow(ConflictError);
        });
    });

    describe('updateRolePermissions', () => {
        it('should update permissions and record audit trail', async () => {
            const role = {
                _id: 'r1',
                name: 'ASSISTANT',
                isSystem: false,
                permissions: ['VIEW_PATIENT'],
                auditTrail: [],
                save: jest.fn().mockResolvedValue(true),
            } as any;
            // Direct mock for findOne (no lean chain)
            (Role.findOne as jest.Mock).mockResolvedValue(role);

            const newPerms = ['VIEW_PATIENT', 'CREATE_PATIENT'];
            const result = await service.updateRolePermissions('t1', 'r1', newPerms, userId);
            expect(result.permissions).toEqual(newPerms);
            expect(role.auditTrail).toHaveLength(1);
            expect(role.auditTrail[0].action).toBe('permissions_changed');
            expect(role.save).toHaveBeenCalled();
        });

        it('should throw ForbiddenError when modifying OWNER role', async () => {
            const ownerRole = { name: 'OWNER', isSystem: true };
            (Role.findOne as jest.Mock).mockResolvedValue(ownerRole);

            await expect(service.updateRolePermissions('t1', 'r1', [], userId))
                .rejects.toThrow(ForbiddenError);
        });
    });

    describe('deleteRole', () => {
        it('should delete a custom role', async () => {
            const role = { _id: 'r1', isSystem: false, deleteOne: jest.fn().mockResolvedValue(true) };
            (Role.findOne as jest.Mock).mockResolvedValue(role);

            await service.deleteRole('t1', 'r1');
            expect(role.deleteOne).toHaveBeenCalled();
        });

        it('should throw ForbiddenError for system roles', async () => {
            const role = { _id: 'r1', isSystem: true };
            (Role.findOne as jest.Mock).mockResolvedValue(role);

            await expect(service.deleteRole('t1', 'r1'))
                .rejects.toThrow(ForbiddenError);
        });

        it('should throw NotFoundError when role not found', async () => {
            (Role.findOne as jest.Mock).mockResolvedValue(null);

            await expect(service.deleteRole('t1', 'nope'))
                .rejects.toThrow(NotFoundError);
        });
    });
});
