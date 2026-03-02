jest.mock('@shared/errors/AppError', () => {
    const actual = jest.requireActual('@shared/errors/AppError');
    return actual;
});
jest.mock('@modules/tenant/models/tenant.model');

import { TenantService } from '@modules/tenant/tenant.service';
import Tenant from '@modules/tenant/models/tenant.model';
import { NotFoundError } from '@shared/errors/AppError';
import { Types } from 'mongoose';

const tenantService = new TenantService();

describe('TenantService', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('createTenant', () => {
        it('should create a tenant with default AR country', async () => {
            const mockTenant = { tenantId: 'tid-1', status: 'trial', plan: 'free_trial' };
            (Tenant.create as jest.Mock).mockResolvedValue(mockTenant);

            const result = await tenantService.createTenant('tid-1', new Types.ObjectId());
            expect(Tenant.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    tenantId: 'tid-1',
                    status: 'trial',
                    plan: 'free_trial',
                })
            );
            expect(result).toEqual(mockTenant);
        });

        it('should accept a custom country code', async () => {
            (Tenant.create as jest.Mock).mockResolvedValue({});

            await tenantService.createTenant('tid-2', new Types.ObjectId(), 'MX');
            expect(Tenant.create).toHaveBeenCalledWith(
                expect.objectContaining({ tenantId: 'tid-2' })
            );
        });
    });

    describe('getTenantById', () => {
        it('should return tenant when found', async () => {
            const mockTenant = { tenantId: 'tid-1', status: 'active' };
            (Tenant.findOne as jest.Mock).mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockTenant),
            });

            const result = await tenantService.getTenantById('tid-1');
            expect(result).toEqual(mockTenant);
        });

        it('should throw NotFoundError when tenant not found', async () => {
            (Tenant.findOne as jest.Mock).mockReturnValue({
                lean: jest.fn().mockResolvedValue(null),
            });

            await expect(tenantService.getTenantById('nope'))
                .rejects.toThrow(NotFoundError);
        });
    });

    describe('updateTenant', () => {
        it('should update and return tenant', async () => {
            const mockTenant = { tenantId: 'tid-1', status: 'active' };
            (Tenant.findOneAndUpdate as jest.Mock).mockResolvedValue(mockTenant);

            const result = await tenantService.updateTenant('tid-1', { status: 'active' } as any);
            expect(result).toEqual(mockTenant);
        });

        it('should throw NotFoundError if tenant not found', async () => {
            (Tenant.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

            await expect(tenantService.updateTenant('nope', {} as any))
                .rejects.toThrow(NotFoundError);
        });
    });

    describe('suspendTenant', () => {
        it('should call updateTenant with suspended status', async () => {
            const mockTenant = { tenantId: 'tid-1', status: 'suspended' };
            (Tenant.findOneAndUpdate as jest.Mock).mockResolvedValue(mockTenant);

            const result = await tenantService.suspendTenant('tid-1', 'Non-payment');
            expect(result.status).toBe('suspended');
        });
    });

    describe('activateTenant', () => {
        it('should call updateTenant with active status', async () => {
            const mockTenant = { tenantId: 'tid-1', status: 'active' };
            (Tenant.findOneAndUpdate as jest.Mock).mockResolvedValue(mockTenant);

            const result = await tenantService.activateTenant('tid-1');
            expect(result.status).toBe('active');
        });
    });
});
